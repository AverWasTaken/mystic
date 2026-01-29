import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'howgay',
  description: 'Calculates how gay a user is',

  slashData: new SlashCommandBuilder()
    .setName('howgay')
    .setDescription('Calculates how gay a user is')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    const gayPercentage = Math.floor(Math.random() * 101);

    await message.reply(`🌈 ${target.username} is **${gayPercentage}%** gay!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const gayPercentage = Math.floor(Math.random() * 101);

    await interaction.reply(`🌈 ${target.username} is **${gayPercentage}%** gay!`);
  }
};

export = command;
