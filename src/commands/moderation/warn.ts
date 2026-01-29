import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { addWarning } from '../../utils/warnings';

const PURPLE = 0x9B59B6;
const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in ms

const command: Command = {
  name: 'warn',
  description: 'Warn a user. Usage: m!warn @user [reason]',

  slashData: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply('You do not have permission to warn members.');
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user to warn. Usage: `m!warn @user [reason]`');
      return;
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const member = message.guild?.members.cache.get(user.id);

    if (!member) {
      await message.reply('User not found in the server.');
      return;
    }

    const warningCount = await addWarning(user.id, message.author.id, reason);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('⚠️ User Warned')
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
        { name: 'Reason', value: reason },
        { name: 'Total Warnings', value: `${warningCount}`, inline: true }
      )
      .setTimestamp();

    // Auto-timeout at 3 warnings
    if (warningCount >= 3 && member.moderatable) {
      try {
        await member.timeout(TIMEOUT_DURATION, `Reached ${warningCount} warnings`);
        embed.addFields({ name: '🔇 Auto-Timeout', value: 'User has been timed out for 1 hour (3+ warnings)' });
      } catch (error) {
        embed.addFields({ name: '⚠️ Timeout Failed', value: 'Could not timeout user' });
      }
    }

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }

    const warningCount = await addWarning(user.id, interaction.user.id, reason);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('⚠️ User Warned')
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason },
        { name: 'Total Warnings', value: `${warningCount}`, inline: true }
      )
      .setTimestamp();

    // Auto-timeout at 3 warnings
    if (warningCount >= 3 && member.moderatable) {
      try {
        await member.timeout(TIMEOUT_DURATION, `Reached ${warningCount} warnings`);
        embed.addFields({ name: '🔇 Auto-Timeout', value: 'User has been timed out for 1 hour (3+ warnings)' });
      } catch (error) {
        embed.addFields({ name: '⚠️ Timeout Failed', value: 'Could not timeout user' });
      }
    }

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
