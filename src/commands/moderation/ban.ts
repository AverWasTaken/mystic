import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'ban',
  description: 'Bans a member from the server. Usage: m!ban @user [reason]',

  slashData: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply('You do not have permission to ban members.');
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user to ban. Usage: `m!ban @user [reason]`');
      return;
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    const member = message.guild?.members.cache.get(user.id);
    if (!member) {
      await message.reply('User not found.');
      return;
    }

    try {
      await member.ban({ reason });
      await message.reply(`${user.tag} has been banned. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await message.reply('Failed to ban the user.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
      return;
    }

    try {
      await member.ban({ reason });
      await interaction.reply(`${user.tag} has been banned. Reason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to ban the user.', ephemeral: true });
    }
  }
};

export = command;
