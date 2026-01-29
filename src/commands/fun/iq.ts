import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'iq',
  description: 'Calculates the IQ of a user',

  slashData: new SlashCommandBuilder()
    .setName('iq')
    .setDescription('Calculates the IQ of a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    const iq = Math.floor(Math.random() * 161); // 0–160

    await message.reply(`🧠 ${target.username}'s IQ is **${iq}**!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const iq = Math.floor(Math.random() * 161);

    await interaction.reply(`🧠 ${target.username}'s IQ is **${iq}**!`);
  }
};

export = command;
