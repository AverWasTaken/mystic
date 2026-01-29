import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'hello',
  description: 'Replies with a greeting!',

  slashData: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Replies with a greeting!'),

  async execute(message: Message): Promise<void> {
    await message.reply(`Hello, ${message.author.username}! 👋`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply(`Hello, ${interaction.user.username}! 👋`);
  }
};

export = command;
