import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getAllAfk, formatDuration } from '../../utils/afk';

const PURPLE = 0x9B59B6;

const command: Command = {
  name: 'afklist',
  description: 'List all currently AFK users',

  slashData: new SlashCommandBuilder()
    .setName('afklist')
    .setDescription('List all currently AFK users'),

  async execute(message: Message): Promise<void> {
    const embed = await buildAfkListEmbed();
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = await buildAfkListEmbed();
    await interaction.reply({ embeds: [embed] });
  }
};

async function buildAfkListEmbed(): Promise<EmbedBuilder> {
  const afkUsers = await getAllAfk();
  const now = Date.now();

  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('📋 AFK Users')
    .setTimestamp();

  if (afkUsers.length === 0) {
    embed.setDescription('No one is currently AFK');
  } else {
    const lines = afkUsers.map((user) => {
      const duration = formatDuration(now - user.timestamp);
      return `**<@${user.userId}>** - ${user.message} (${duration} ago)`;
    });
    embed.setDescription(lines.join('\n'));
    embed.setFooter({ text: `${afkUsers.length} user${afkUsers.length !== 1 ? 's' : ''} AFK` });
  }

  return embed;
}

export = command;
