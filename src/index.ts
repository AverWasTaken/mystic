import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits, Events, REST, Routes, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import type { MysticClient, Command } from './types';

dotenv.config();

const PREFIX = 'm!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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

// Handle prefix commands
client.on(Events.MessageCreate, async message => {
  // Ignore bots
  if (message.author.bot) return;

  // Check for prefix
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
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
    activities: [{ name: 'Over Mystic', type: ActivityType.Watching }],
    status: 'online',
  });

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
