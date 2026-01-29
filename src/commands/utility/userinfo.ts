import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'userinfo',
  description: 'Displays information about your user',

  slashData: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get info about (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message): Promise<void> {
    const user = message.mentions.users.first() ?? message.author;
    await message.reply(`🙋 Username: ${user.username}\n🆔 ID: ${user.id}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user') ?? interaction.user;
    await interaction.reply(`🙋 Username: ${user.username}\n🆔 ID: ${user.id}`);
  }
};

export = command;
