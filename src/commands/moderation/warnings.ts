import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getWarnings } from '../../utils/warnings';

const PURPLE = 0x9B59B6;

const command: Command = {
  name: 'warnings',
  description: "View a user's warnings. Usage: m!warnings @user",

  slashData: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a user's warnings")
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user to check. Usage: `m!warnings @user`');
      return;
    }

    const warnings = await getWarnings(user.id);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`📋 Warnings for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('This user has no warnings.');
    } else {
      embed.setDescription(`Total: **${warnings.length}** warning(s)`);
      
      // Show up to 10 most recent warnings
      const displayWarnings = warnings.slice(0, 10);
      for (let i = 0; i < displayWarnings.length; i++) {
        const w = displayWarnings[i];
        const date = new Date(w.timestamp).toLocaleDateString();
        embed.addFields({
          name: `#${i + 1} - ${date}`,
          value: `**Reason:** ${w.reason}\n**By:** <@${w.odmoderatorId}>`,
        });
      }

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
      }
    }

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const warnings = await getWarnings(user.id);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle(`📋 Warnings for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('This user has no warnings.');
    } else {
      embed.setDescription(`Total: **${warnings.length}** warning(s)`);
      
      const displayWarnings = warnings.slice(0, 10);
      for (let i = 0; i < displayWarnings.length; i++) {
        const w = displayWarnings[i];
        const date = new Date(w.timestamp).toLocaleDateString();
        embed.addFields({
          name: `#${i + 1} - ${date}`,
          value: `**Reason:** ${w.reason}\n**By:** <@${w.odmoderatorId}>`,
        });
      }

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
      }
    }

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
