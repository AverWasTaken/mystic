import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'removerole',
  description: 'Remove a role from a member. Usage: m!removerole @user @role',

  slashData: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove the role from')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to remove')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await message.reply('You do not have permission to manage roles.');
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user. Usage: `m!removerole @user @role`');
      return;
    }

    const role = message.mentions.roles.first();
    if (!role) {
      await message.reply('Please mention a role. Usage: `m!removerole @user @role`');
      return;
    }

    const member = message.guild?.members.cache.get(user.id);
    if (!member) {
      await message.reply('User not found in the server.');
      return;
    }

    const botMember = message.guild?.members.me;
    if (!botMember || role.position >= botMember.roles.highest.position) {
      await message.reply('I cannot remove this role (it is higher than or equal to my highest role).');
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      await message.reply(`${user.tag} doesn't have the ${role.name} role.`);
      return;
    }

    try {
      await member.roles.remove(role);
      await message.reply(`✅ Removed **${role.name}** from ${user.tag}`);
    } catch (err) {
      console.error('Failed to remove role:', err);
      await message.reply('Failed to remove the role.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);

    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }

    const botMember = interaction.guild?.members.me;
    if (!botMember || role.position >= botMember.roles.highest.position) {
      await interaction.reply({ content: 'I cannot remove this role (it is higher than or equal to my highest role).', ephemeral: true });
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      await interaction.reply({ content: `${user.tag} doesn't have the ${role.name} role.`, ephemeral: true });
      return;
    }

    try {
      await member.roles.remove(role.id);
      await interaction.reply(`✅ Removed **${role.name}** from ${user.tag}`);
    } catch (err) {
      console.error('Failed to remove role:', err);
      await interaction.reply({ content: 'Failed to remove the role.', ephemeral: true });
    }
  }
};

export = command;
