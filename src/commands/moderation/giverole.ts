import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'giverole',
  description: 'Give a role to a member. Usage: m!giverole @user @role',

  slashData: new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Give a role to a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give the role to')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to give')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }

    const user = message.mentions.users.first();
    if (!user) {
      await message.reply('Please mention a user. Usage: `m!giverole @user @role`');
      return;
    }

    const role = message.mentions.roles.first();
    if (!role) {
      await message.reply('Please mention a role. Usage: `m!giverole @user @role`');
      return;
    }

    const member = message.guild?.members.cache.get(user.id);
    if (!member) {
      await message.reply('User not found in the server.');
      return;
    }

    const botMember = message.guild?.members.me;
    if (!botMember || role.position >= botMember.roles.highest.position) {
      await message.reply('I cannot assign this role (it is higher than or equal to my highest role).');
      return;
    }

    if (member.roles.cache.has(role.id)) {
      await message.reply(`${user.tag} already has the ${role.name} role.`);
      return;
    }

    try {
      await member.roles.add(role);
      await message.reply(`✅ Gave **${role.name}** to ${user.tag}`);
    } catch (err) {
      console.error('Failed to add role:', err);
      await message.reply('Failed to add the role.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);

    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }

    const botMember = interaction.guild?.members.me;
    if (!botMember || role.position >= botMember.roles.highest.position) {
      await interaction.reply({ content: 'I cannot assign this role (it is higher than or equal to my highest role).', ephemeral: true });
      return;
    }

    if (member.roles.cache.has(role.id)) {
      await interaction.reply({ content: `${user.tag} already has the ${role.name} role.`, ephemeral: true });
      return;
    }

    try {
      await member.roles.add(role.id);
      await interaction.reply(`✅ Gave **${role.name}** to ${user.tag}`);
    } catch (err) {
      console.error('Failed to add role:', err);
      await interaction.reply({ content: 'Failed to add the role.', ephemeral: true });
    }
  }
};

export = command;
