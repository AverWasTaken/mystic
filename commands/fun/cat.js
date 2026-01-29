// commands/fun/cat.js
const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Get a random cute cat picture!'),

  async execute(interaction) {
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json();

      if (!data[0] || !data[0].url) {
        return await interaction.reply('😿 Couldn’t fetch a cat image right now. Try again later.');
      }

      await interaction.reply({ content: '🐱 Here\'s a cat for you!', files: [data[0].url] });
    } catch (error) {
      console.error('Error fetching cat image:', error);
      await interaction.reply('😿 Something went wrong while getting a cat image.');
    }
  }
};
