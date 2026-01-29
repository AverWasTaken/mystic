import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getLeaderboard } from '../../utils/economy';

const MEDALS = ['🥇', '🥈', '🥉'];

const command: Command = {
  name: 'leaderboard',
  aliases: ['lb'],
  description: 'View the top 10 richest users',

  slashData: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 richest users'),

  async execute(message: Message, args: string[]): Promise<void> {
    const leaderboard = await getLeaderboard(10);
    
    if (leaderboard.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🏆 Leaderboard')
        .setDescription('No one has any coins yet!')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const lines = await Promise.all(leaderboard.map(async (entry) => {
      const medal = MEDALS[entry.rank - 1] || `**${entry.rank}.**`;
      try {
        const user = await message.client.users.fetch(entry.userId);
        return `${medal} ${user.username} — **${entry.balance.toLocaleString()}** coins`;
      } catch {
        return `${medal} Unknown User — **${entry.balance.toLocaleString()}** coins`;
      }
    }));

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🏆 Leaderboard')
      .setDescription(lines.join('\n'))
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    
    const leaderboard = await getLeaderboard(10);
    
    if (leaderboard.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🏆 Leaderboard')
        .setDescription('No one has any coins yet!')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const lines = await Promise.all(leaderboard.map(async (entry) => {
      const medal = MEDALS[entry.rank - 1] || `**${entry.rank}.**`;
      try {
        const user = await interaction.client.users.fetch(entry.userId);
        return `${medal} ${user.username} — **${entry.balance.toLocaleString()}** coins`;
      } catch {
        return `${medal} Unknown User — **${entry.balance.toLocaleString()}** coins`;
      }
    }));

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🏆 Leaderboard')
      .setDescription(lines.join('\n'))
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};

export = command;
