import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const roasts = [
  "you're the reason shampoo has instructions.",
  "you're the reason pluto lost its status",
  "if you fell you'd resplit pangea",
  "you're so obese you make ppl look skinny",
  "ur built like a solar eclipse",
  "you're the reason fridges have locks",
];

const command: Command = {
  name: 'roast',
  description: 'Gives a random roast',

  slashData: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Gives a random roast to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to roast (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    await message.reply(`🔥 <@${target.id}> ${roast}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    await interaction.reply(`🔥 <@${target.id}> ${roast}`);
  }
};

export = command;
