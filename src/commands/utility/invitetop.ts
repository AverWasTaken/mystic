import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getTopInviters } from '../../utils/inviteTracker';

const command: Command = {
  name: 'invitetop',
  description: 'Show the top 10 inviters in the server',

  slashData: new SlashCommandBuilder()
    .setName('invitetop')
    .setDescription('Show the top 10 inviters in the server'),

  async execute(message: Message): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    const topInviters = await getTopInviters(message.guild.id, 10);
    
    if (topInviters.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📊 Invite Leaderboard')
        .setDescription('No invites have been tracked yet.')
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      return;
    }

    const leaderboardLines = await Promise.all(
      topInviters.map(async (entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        return `${medal} <@${entry.inviterId}> — **${entry.count}** invite${entry.count !== 1 ? 's' : ''}`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Invite Leaderboard')
      .setDescription(leaderboardLines.join('\n'))
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() || undefined })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const topInviters = await getTopInviters(interaction.guild.id, 10);
    
    if (topInviters.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📊 Invite Leaderboard')
        .setDescription('No invites have been tracked yet.')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const leaderboardLines = await Promise.all(
      topInviters.map(async (entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        return `${medal} <@${entry.inviterId}> — **${entry.count}** invite${entry.count !== 1 ? 's' : ''}`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Invite Leaderboard')
      .setDescription(leaderboardLines.join('\n'))
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
