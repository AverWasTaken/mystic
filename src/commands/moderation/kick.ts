import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'kick',
  description: 'Kick a member from the server. Usage: m!kick @user [reason]',

  slashData: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
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
      await message.reply('Please mention a user to kick. Usage: `m!kick @user [reason]`');
      return;
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const member = message.guild?.members.cache.get(user.id);

    if (!member) {
      await message.reply('User not found in the server.');
      return;
    }
    if (!member.kickable) {
      await message.reply('I cannot kick this user.');
      return;
    }

    await member.kick(reason);
    await message.reply(`${user.tag} has been kicked.\nReason: ${reason}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
      return;
    }

    await member.kick(reason);
    await interaction.reply(`${user.tag} has been kicked.\nReason: ${reason}`);
  }
};

export = command;
