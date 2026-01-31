import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, GuildMember, EmbedBuilder } from 'discord.js';
import ms from 'ms';
import type { StringValue } from 'ms';
import type { Command } from '../../types';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'timeout',
  description: 'Timeout a member. Usage: m!timeout @user <duration> [reason]',

  slashData: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g., 10s, 1m, 1h, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user. Usage: `m!timeout @user <duration> [reason]`');
      return;
    }

    const durationStr = args[1];
    if (!durationStr) {
      await message.reply('Please provide a duration (e.g., 10s, 1m, 1h, 1d). Usage: `m!timeout @user <duration> [reason]`');
      return;
    }

    const reason = args.slice(2).join(' ') || 'No reason provided';
    const member = message.guild?.members.cache.get(user.id) as GuildMember | undefined;
    const duration = ms(durationStr as StringValue);

    if (!member) {
      await message.reply('User not found.');
      return;
    }

    if (!duration || duration < 5000 || duration > 28 * 24 * 60 * 60 * 1000) {
      await message.reply('Invalid duration. Min: 5s, Max: 28d.');
      return;
    }

    await member.timeout(duration, reason);
    await message.reply(`${user.tag} has been timed out for ${durationStr}.\nReason: ${reason}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild?.members.cache.get(user.id) as GuildMember | undefined;
    const duration = ms(durationStr as StringValue);

    if (!member) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
      return;
    }

    if (!duration || duration < 5000 || duration > 28 * 24 * 60 * 60 * 1000) {
      await interaction.reply({ content: 'Invalid duration. Min: 5s, Max: 28d.', ephemeral: true });
      return;
    }

    await member.timeout(duration, reason);
    await interaction.reply(`${user.tag} has been timed out for ${durationStr}.\nReason: ${reason}`);
  }
};

export = command;
