import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { clearWarnings } from '../../utils/warnings';

const PURPLE = 0x9B59B6;

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'clearwarnings',
  description: "Clear all warnings for a user. Usage: m!clearwarnings @user",

  slashData: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription("Clear all warnings for a user")
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to clear warnings for')
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
      await message.reply('Please mention a user. Usage: `m!clearwarnings @user`');
      return;
    }

    const clearedCount = await clearWarnings(user.id);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🗑️ Warnings Cleared')
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Cleared By', value: `${message.author.tag}`, inline: true },
        { name: 'Warnings Removed', value: `${clearedCount}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const clearedCount = await clearWarnings(user.id);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🗑️ Warnings Cleared')
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Cleared By', value: `${interaction.user.tag}`, inline: true },
        { name: 'Warnings Removed', value: `${clearedCount}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
