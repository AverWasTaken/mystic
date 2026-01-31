import fs from 'node:fs';
import path from 'node:path';
import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { DEFAULT_PREFIX } from '../../utils/prefixes';

// Category emojis
const CATEGORY_EMOJIS: Record<string, string> = {
  admin: '⚙️',
  fun: '🎮',
  gambling: '🎰',
  general: '💬',
  moderation: '🛡️',
  utility: '🔧'
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  admin: 'Admin',
  fun: 'Fun',
  gambling: 'Gambling',
  general: 'General',
  moderation: 'Moderation',
  utility: 'Utility'
};

interface CommandInfo {
  name: string;
  description: string;
  aliases?: string[];
  category: string;
  hasSlash: boolean;
  usage?: string;
}

// Get all commands organized by category
function getCommandsByCategory(): Map<string, CommandInfo[]> {
  const commandsDir = path.join(__dirname, '..');
  const categories = new Map<string, CommandInfo[]>();

  const folders = fs.readdirSync(commandsDir);

  for (const folder of folders) {
    const folderPath = path.join(commandsDir, folder);
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    const commands: CommandInfo[] = [];

    for (const file of files) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const cmd = require(path.join(folderPath, file)) as Command;
        if (!cmd.name) continue;

        // Build usage string from slash command options if available
        let usage = `${DEFAULT_PREFIX}${cmd.name}`;
        if (cmd.slashData) {
          const data = cmd.slashData.toJSON();
          if (data.options && data.options.length > 0) {
            const optionStrings = data.options.map((opt: { name: string; required?: boolean }) => {
              return opt.required ? `<${opt.name}>` : `[${opt.name}]`;
            });
            usage += ' ' + optionStrings.join(' ');
          }
        }

        commands.push({
          name: cmd.name,
          description: cmd.description || 'No description available',
          aliases: cmd.aliases,
          category: folder,
          hasSlash: !!cmd.slashData,
          usage
        });
      } catch {
        // Skip broken commands
      }
    }

    if (commands.length > 0) {
      // Sort commands alphabetically
      commands.sort((a, b) => a.name.localeCompare(b.name));
      categories.set(folder, commands);
    }
  }

  return categories;
}

// Find a command by name or alias
function findCommand(name: string): CommandInfo | null {
  const categories = getCommandsByCategory();
  const searchName = name.toLowerCase();

  for (const [, commands] of categories) {
    for (const cmd of commands) {
      if (cmd.name.toLowerCase() === searchName) {
        return cmd;
      }
      if (cmd.aliases?.some(alias => alias.toLowerCase() === searchName)) {
        return cmd;
      }
    }
  }

  return null;
}

// Build the main commands list embed
function buildCommandListEmbed(): EmbedBuilder {
  const categories = getCommandsByCategory();

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('📜 Mystic Commands')
    .setDescription(`Use \`${DEFAULT_PREFIX}commands <command>\` or \`/commands command:<name>\` for details on a specific command.\n\n` +
      `**Prefix:** \`${DEFAULT_PREFIX}\` • Most commands also work as \`/slash\` commands!`)
    .setTimestamp()
    .setFooter({ text: `${getTotalCommandCount(categories)} commands available` });

  // Sort categories for consistent order
  const categoryOrder = ['general', 'utility', 'fun', 'gambling', 'moderation', 'admin'];

  for (const categoryKey of categoryOrder) {
    const commands = categories.get(categoryKey);
    if (!commands || commands.length === 0) continue;

    const emoji = CATEGORY_EMOJIS[categoryKey] || '📁';
    const displayName = CATEGORY_NAMES[categoryKey] || categoryKey;
    const commandList = commands.map(c => `\`${c.name}\``).join(', ');

    embed.addFields({
      name: `${emoji} ${displayName}`,
      value: commandList,
      inline: false
    });
  }

  return embed;
}

// Build detailed embed for a single command
function buildCommandDetailEmbed(cmd: CommandInfo): EmbedBuilder {
  const emoji = CATEGORY_EMOJIS[cmd.category] || '📁';
  const categoryName = CATEGORY_NAMES[cmd.category] || cmd.category;

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`📖 Command: ${cmd.name}`)
    .setDescription(cmd.description)
    .addFields(
      { name: '📂 Category', value: `${emoji} ${categoryName}`, inline: true },
      { name: '⌨️ Usage', value: `\`${cmd.usage}\``, inline: true }
    )
    .setTimestamp();

  // Add aliases if present
  if (cmd.aliases && cmd.aliases.length > 0) {
    embed.addFields({
      name: '🔗 Aliases',
      value: cmd.aliases.map(a => `\`${a}\``).join(', '),
      inline: true
    });
  }

  // Slash command availability
  embed.addFields({
    name: '🎯 Slash Command',
    value: cmd.hasSlash ? `✅ \`/${cmd.name}\`` : '❌ Prefix only',
    inline: true
  });

  return embed;
}

function getTotalCommandCount(categories: Map<string, CommandInfo[]>): number {
  let count = 0;
  for (const [, commands] of categories) {
    count += commands.length;
  }
  return count;
}

const command: Command = {
  name: 'commands',
  description: 'List all available commands or get details about a specific command',
  aliases: ['cmds', 'cmdlist'],

  slashData: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('List all available commands or get details about a specific command')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get details about a specific command')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const commandName = args[0]?.toLowerCase();

    if (commandName) {
      // Show details for a specific command
      const cmd = findCommand(commandName);

      if (!cmd) {
        const embed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Command Not Found')
          .setDescription(`No command found with name or alias \`${commandName}\`.\n\nUse \`${DEFAULT_PREFIX}commands\` to see all available commands.`);

        await message.reply({ embeds: [embed] });
        return;
      }

      await message.reply({ embeds: [buildCommandDetailEmbed(cmd)] });
    } else {
      // Show all commands
      await message.reply({ embeds: [buildCommandListEmbed()] });
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const commandName = interaction.options.getString('command')?.toLowerCase();

    if (commandName) {
      // Show details for a specific command
      const cmd = findCommand(commandName);

      if (!cmd) {
        const embed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('❌ Command Not Found')
          .setDescription(`No command found with name or alias \`${commandName}\`.\n\nUse \`/commands\` to see all available commands.`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      await interaction.reply({ embeds: [buildCommandDetailEmbed(cmd)] });
    } else {
      // Show all commands
      await interaction.reply({ embeds: [buildCommandListEmbed()] });
    }
  }
};

export = command;
