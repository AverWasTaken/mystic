// commands/fun/joke.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tells you a random joke'),

  async execute(interaction) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "I told my computer I needed a break, and it said 'No problem — I'll go to sleep.'",
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
      "I asked my dog what's two minus two. He said nothing.",
      "Why can't your nose be 12 inches long? Because then it would be a foot.",
      "Parallel lines have so much in common. It’s a shame they’ll never meet.",
    ];

    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    await interaction.reply(`😂 ${randomJoke}`);
  }
};
