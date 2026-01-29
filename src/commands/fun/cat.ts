import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

interface CatApiResponse {
  url: string;
}

const command: Command = {
  name: 'cat',
  description: 'Get a random cute cat picture!',

  slashData: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Get a random cute cat picture!'),

  async execute(message: Message): Promise<void> {
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json() as CatApiResponse[];

      if (!data[0] || !data[0].url) {
        await message.reply("😿 Couldn't fetch a cat image right now. Try again later.");
        return;
      }

      await message.reply({ content: "🐱 Here's a cat for you!", files: [data[0].url] });
    } catch (error) {
      console.error('Error fetching cat image:', error);
      await message.reply('😿 Something went wrong while getting a cat image.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json() as CatApiResponse[];

      if (!data[0] || !data[0].url) {
        await interaction.editReply("😿 Couldn't fetch a cat image right now. Try again later.");
        return;
      }

      await interaction.editReply({ content: "🐱 Here's a cat for you!", files: [data[0].url] });
    } catch (error) {
      console.error('Error fetching cat image:', error);
      await interaction.editReply('😿 Something went wrong while getting a cat image.');
    }
  }
};

export = command;
