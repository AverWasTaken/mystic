import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'howcrazy',
  aliases: ['crazy', 'howchaotic', 'chaotic'],
  description: 'Calculates how crazy/chaotic a user is',

  slashData: new SlashCommandBuilder()
    .setName('howcrazy')
    .setDescription('Calculates how crazy/chaotic a user is')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    const crazyPercentage = Math.floor(Math.random() * 101);

    let emoji = '🤪';
    if (crazyPercentage >= 90) emoji = '🤯';
    else if (crazyPercentage >= 70) emoji = '😈';
    else if (crazyPercentage >= 50) emoji = '🤪';
    else if (crazyPercentage >= 30) emoji = '😅';
    else emoji = '😇';

    await message.reply(`${emoji} ${target.username} is **${crazyPercentage}%** crazy!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const crazyPercentage = Math.floor(Math.random() * 101);

    let emoji = '🤪';
    if (crazyPercentage >= 90) emoji = '🤯';
    else if (crazyPercentage >= 70) emoji = '😈';
    else if (crazyPercentage >= 50) emoji = '🤪';
    else if (crazyPercentage >= 30) emoji = '😅';
    else emoji = '😇';

    await interaction.reply(`${emoji} ${target.username} is **${crazyPercentage}%** crazy!`);
  }
};

export = command;
