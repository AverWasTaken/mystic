import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits, Events, REST, Routes, ActivityType, Partials, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import type { MysticClient, Command } from './types';
import { handleEditingAssistant, isBotMentionOrReply } from './utils/editingAssistant';
import { setupReactionRoles } from './utils/reactionRoles';
import { setupWelcome } from './utils/welcome';
import { setupTikTokNotify } from './utils/tiktokNotify';
import { getAfk, getAfkByIds, removeAfk, formatDuration } from './utils/afk';
import { setSnipe } from './utils/snipe';
import { logMessageEdit, logMessageDelete, logMemberJoin, logMemberLeave } from './utils/logs';
import { handleStarboardReaction } from './utils/starboard';
import { initPrefixSystem, getMatchedPrefix, DEFAULT_PREFIX } from './utils/prefixes';

dotenv.config();

const PREFIX = DEFAULT_PREFIX;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember
  ]
}) as MysticClient;

// Global vars for auto-react
client.targetUserId = null;
client.autoReactEnabled = false;

// Store commands
client.commands = new Collection<string, Command>();
client.mimicTargets = {};

// Load commands dynamically
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const stat = fs.statSync(commandsPath);
  if (!stat.isDirectory()) continue;
  
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const command = require(filePath) as Command;
      if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
      } else {
        console.warn(`[WARNING] Skipping broken command: ${filePath}`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to load ${filePath}`, err);
    }
  }
}

const AFK_PURPLE = 0x9B59B6;

// Handle prefix commands
client.on(Events.MessageCreate, async message => {
  // Ignore bots
  if (message.author.bot) return;

  // === AFK System ===
  // Check if the message author is AFK and remove their status
  try {
    const result = await removeAfk(message.author.id);
    if (result.removed) {
      const duration = formatDuration(result.duration);
      const embed = new EmbedBuilder()
        .setColor(AFK_PURPLE)
        .setTitle('👋 Welcome Back!')
        .setDescription(`You were AFK for **${duration}**`)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Error checking/removing AFK status:', err);
  }

  // Check if message mentions any AFK users
  try {
    // Collect mentioned user IDs (from mentions and reply)
    const mentionedUserIds = new Set<string>();
    
    // Direct mentions
    message.mentions.users.forEach(user => {
      if (!user.bot && user.id !== message.author.id) {
        mentionedUserIds.add(user.id);
      }
    });
    
    // Reply mentions
    if (message.reference?.messageId && message.channel.isTextBased()) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (!repliedMessage.author.bot && repliedMessage.author.id !== message.author.id) {
          mentionedUserIds.add(repliedMessage.author.id);
        }
      } catch {
        // Message might be deleted, ignore
      }
    }
    
    if (mentionedUserIds.size > 0) {
      const afkStatuses = await getAfkByIds(Array.from(mentionedUserIds));
      
      for (const [userId, afkData] of Object.entries(afkStatuses)) {
        if (afkData) {
          const user = await client.users.fetch(userId).catch(() => null);
          const username = user?.displayName || user?.username || 'That user';
          
          const embed = new EmbedBuilder()
            .setColor(AFK_PURPLE)
            .setTitle('💤 User is AFK')
            .setDescription(`**${username}** is AFK: ${afkData.message}`)
            .setFooter({ text: `AFK since ${new Date(afkData.timestamp).toLocaleString()}` });
          
          await message.reply({ embeds: [embed] });
        }
      }
    }
  } catch (err) {
    console.error('Error checking mentioned users AFK status:', err);
  }
  // === End AFK System ===

  // Handle bot mentions/replies for editing assistant
  if (client.user && await isBotMentionOrReply(message, client.user.id)) {
    await handleEditingAssistant(message);
    return;
  }

  // Check for prefix (default or user's custom prefix)
  const matchedPrefix = getMatchedPrefix(message.content, message.author.id);
  if (matchedPrefix) {
    const args = message.content.slice(matchedPrefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply('There was an error executing this command.');
    }
    return;
  }

  // Only process non-command messages below
  if (!message.guild) return;

  // Auto-react to targeted user
  if (client.autoReactEnabled && message.author.id === client.targetUserId) {
    try {
      await message.react("💀");
      console.log(`Reacted to ${message.author.tag}'s message`);
    } catch (err) {
      console.error(`Failed to react: ${err}`);
    }
  }

  // Mimic logic
  const guildId = message.guild.id;
  const targets = client.mimicTargets[guildId];
  if (targets && targets.has(message.author.id)) {
    const text = message.content;
    if (!text.trim()) return;

    const mocked = text.split('')
      .map(char => Math.random() < 0.5 ? char.toLowerCase() : char.toUpperCase())
      .join('');

    await message.channel.send(mocked);
  }
});

// Handle AFK removal on reaction
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  // Ignore bots
  if (user.bot) return;

  // Handle starboard
  try {
    await handleStarboardReaction(reaction);
  } catch (err) {
    console.error('Error handling starboard reaction:', err);
  }

  // Handle AFK removal
  try {
    const result = await removeAfk(user.id);
    if (result.removed) {
      const duration = formatDuration(result.duration);
      
      // Fetch the full message if partial
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch {
          return; // Message might be deleted
        }
      }

      const embed = new EmbedBuilder()
        .setColor(AFK_PURPLE)
        .setTitle('👋 Welcome Back!')
        .setDescription(`You were AFK for **${duration}**`)
        .setTimestamp();

      // Send in the channel where the reaction was added
      if (reaction.message.channel.isTextBased() && 'send' in reaction.message.channel) {
        await reaction.message.channel.send({ 
          content: `<@${user.id}>`,
          embeds: [embed] 
        });
      }
    }
  } catch (err) {
    console.error('Error removing AFK on reaction:', err);
  }
});

// Handle message deletions for snipe and logging
client.on(Events.MessageDelete, async message => {
  // Skip DMs
  if (!message.guild) return;

  // Log all deletions (including bots) to the log channel
  if (!message.author?.bot) {
    await logMessageDelete(client, message);
  }

  // Only snipe non-bot messages with content
  if (!message.content || message.author?.bot) return;

  setSnipe(message.channel.id, {
    content: message.content,
    authorTag: message.author?.tag || 'Unknown',
    authorAvatar: message.author?.displayAvatarURL() || null,
    deletedAt: Date.now()
  });
});

// Handle message edits for logging
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  // Skip DMs and bots
  if (!newMessage.guild || newMessage.author?.bot) return;

  await logMessageEdit(client, oldMessage, newMessage);
});

// Handle member joins
client.on(Events.GuildMemberAdd, async member => {
  await logMemberJoin(client, member);
});

// Handle member leaves
client.on(Events.GuildMemberRemove, async member => {
  // GuildMemberRemove can receive a partial member, but we need GuildMember
  // The partials allow us to still get the user info even if they weren't cached
  await logMemberLeave(client, member as import('discord.js').GuildMember);
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  if (!command.executeSlash) {
    await interaction.reply({ content: 'This command does not support slash commands yet.', ephemeral: true });
    return;
  }

  try {
    await command.executeSlash(interaction);
  } catch (error) {
    console.error(`Error executing slash command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error executing this command.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }
});

client.once(Events.ClientReady, async readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Set bot status
  readyClient.user.setPresence({
    activities: [{ name: 'over mystic.', type: ActivityType.Watching }],
    status: 'online',
  });

  // Setup reaction roles
  setupReactionRoles(client);

  // Setup welcome system
  setupWelcome(client);

  // Setup TikTok notifications
  setupTikTokNotify(client);

  // Initialize prefix system (load cache)
  await initPrefixSystem();

  // Build slash command data from loaded commands
  const slashCommands = [];
  for (const [name, command] of client.commands) {
    if (command.slashData) {
      slashCommands.push(command.slashData.toJSON());
      console.log(`[SLASH] Prepared: /${name}`);
    }
  }

  // Register slash commands globally
  const rest = new REST().setToken(process.env.TOKEN!);
  
  try {
    console.log(`Registering ${slashCommands.length} slash commands globally...`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: slashCommands }
    );
    console.log(`Successfully registered ${slashCommands.length} global slash commands!`);
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.login(process.env.TOKEN);
