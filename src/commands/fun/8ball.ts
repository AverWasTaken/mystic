import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const responses = [
  'Yes.',
  'No.',
  'Maybe.',
  'Ask again later.',
  'Definitely.',
  'Absolutely not.',
  "I don't know, try flipping a coin.",
];

const command: Command = {
  name: '8ball',
  description: 'Ask the magic 8ball a question',

  slashData: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question for the 8ball')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const question = args.join(' ');
    
    if (!question) {
      await message.reply('Please provide a question! Usage: `m!8ball <question>`');
      return;
    }

    const answer = responses[Math.floor(Math.random() * responses.length)];
    await message.reply(`🎱 **Question:** ${question}\n**Answer:** ${answer}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const question = interaction.options.getString('question', true);
    const answer = responses[Math.floor(Math.random() * responses.length)];
    await interaction.reply(`🎱 **Question:** ${question}\n**Answer:** ${answer}`);
  }
};

export = command;
