import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, GuildMember, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'untime',
  description: 'Removes a timeout from a user. Usage: m!untime @user',

  slashData: new SlashCommandBuilder()
    .setName('untime')
    .setDescription('Removes a timeout from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove timeout from')
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
      await message.reply('Please mention a user. Usage: `m!untime @user`');
      return;
    }

    const member = message.guild?.members.cache.get(user.id) as GuildMember | undefined;

    if (!member) {
      await message.reply('❌ User not found.');
      return;
    }

    try {
      await member.timeout(null);
      await message.reply(`✅ Timeout removed from ${member.user.tag}`);
    } catch (err) {
      console.error(err);
      await message.reply('❌ Failed to remove timeout.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const member = interaction.guild?.members.cache.get(user.id) as GuildMember | undefined;

    if (!member) {
      await interaction.reply({ content: '❌ User not found.', ephemeral: true });
      return;
    }

    try {
      await member.timeout(null);
      await interaction.reply(`✅ Timeout removed from ${member.user.tag}`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to remove timeout.', ephemeral: true });
    }
  }
};

export = command;
