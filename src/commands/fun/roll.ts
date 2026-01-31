import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'roll',
  aliases: ['dice', 'random'],
  description: 'Roll a random number within a range',

  slashData: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a random number within a range')
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Minimum value (default: 1)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('max')
        .setDescription('Maximum value (default: 100)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    let min = 1;
    let max = 100;

    if (args.length === 1) {
      // Single arg = max value
      const parsed = parseInt(args[0]);
      if (!isNaN(parsed) && parsed > 0) {
        max = parsed;
      }
    } else if (args.length >= 2) {
      // Two args = min and max
      const parsedMin = parseInt(args[0]);
      const parsedMax = parseInt(args[1]);
      if (!isNaN(parsedMin) && !isNaN(parsedMax)) {
        min = Math.min(parsedMin, parsedMax);
        max = Math.max(parsedMin, parsedMax);
      }
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    await message.reply(`🎲 You rolled **${result}** (${min}-${max})`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    let min = interaction.options.getInteger('min') ?? 1;
    let max = interaction.options.getInteger('max') ?? 100;

    // Ensure min is less than max
    if (min > max) {
      [min, max] = [max, min];
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    await interaction.reply(`🎲 You rolled **${result}** (${min}-${max})`);
  }
};

export = command;
