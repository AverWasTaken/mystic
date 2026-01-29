import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

interface DogApiResponse {
  status: string;
  message: string;
}

const command: Command = {
  name: 'dog',
  description: 'Get a random cute dog picture!',

  slashData: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random cute dog picture!'),

  async execute(message: Message): Promise<void> {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json() as DogApiResponse;

      if (data.status !== 'success') {
        await message.reply("🐶 Couldn't fetch a dog image right now. Try again later.");
        return;
      }

      await message.reply({ content: "🐶 Here's a dog for you!", files: [data.message] });
    } catch (error) {
      console.error('Error fetching dog image:', error);
      await message.reply('🐶 Something went wrong while getting a dog image.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json() as DogApiResponse;

      if (data.status !== 'success') {
        await interaction.editReply("🐶 Couldn't fetch a dog image right now. Try again later.");
        return;
      }

      await interaction.editReply({ content: "🐶 Here's a dog for you!", files: [data.message] });
    } catch (error) {
      console.error('Error fetching dog image:', error);
      await interaction.editReply('🐶 Something went wrong while getting a dog image.');
    }
  }
};

export = command;
