import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';

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
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply('You do not have permission to unban members.');
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
