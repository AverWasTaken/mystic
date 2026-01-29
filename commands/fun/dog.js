// commands/fun/dog.js
const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random cute dog picture!'),

  async execute(interaction) {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json();

      if (data.status !== 'success') {
        return await interaction.reply('🐶 Couldn’t fetch a dog image right now. Try again later.');
      }

      await interaction.reply({ content: '🐶 Here\'s a dog for you!', files: [data.message] });
    } catch (error) {
      console.error('Error fetching dog image:', error);
      await interaction.reply('🐶 Something went wrong while getting a dog image.');
    }
  }
};
