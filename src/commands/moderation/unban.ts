import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'unban',
  description: 'Unbans a user by ID. Usage: m!unban <userid>',

  slashData: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user by their ID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The user ID to unban')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }

    const userId = args[0];
    if (!userId) {
      await message.reply('Please provide a user ID. Usage: `m!unban <userid>`');
      return;
    }

    try {
      await message.guild?.members.unban(userId);
      await message.reply(`✅ Successfully unbanned <@${userId}>`);
    } catch (err) {
      console.error(err);
      await message.reply('❌ Failed to unban. Maybe invalid ID or not banned.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }

    const userId = interaction.options.getString('userid', true);

    try {
      await interaction.guild?.members.unban(userId);
      await interaction.reply(`✅ Successfully unbanned <@${userId}>`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Failed to unban. Maybe invalid ID or not banned.', ephemeral: true });
    }
  }
};

export = command;
