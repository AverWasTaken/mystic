import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'howhot',
  aliases: ['hot', 'hotness'],
  description: 'Calculates how hot a user is',

  slashData: new SlashCommandBuilder()
    .setName('howhot')
    .setDescription('Calculates how hot a user is')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    const hotPercentage = Math.floor(Math.random() * 101);

    let emoji = '🔥';
    if (hotPercentage >= 90) emoji = '🥵';
    else if (hotPercentage >= 70) emoji = '🔥';
    else if (hotPercentage >= 50) emoji = '😏';
    else if (hotPercentage >= 30) emoji = '😐';
    else emoji = '🥶';

    await message.reply(`${emoji} ${target.username} is **${hotPercentage}%** hot!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const hotPercentage = Math.floor(Math.random() * 101);

    let emoji = '🔥';
    if (hotPercentage >= 90) emoji = '🥵';
    else if (hotPercentage >= 70) emoji = '🔥';
    else if (hotPercentage >= 50) emoji = '😏';
    else if (hotPercentage >= 30) emoji = '😐';
    else emoji = '🥶';

    await interaction.reply(`${emoji} ${target.username} is **${hotPercentage}%** hot!`);
  }
};

export = command;
