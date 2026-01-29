// commands/fun/8ball.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8ball a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question')
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const responses = [
      'Yes.',
      'No.',
      'Maybe.',
      'Ask again later.',
      'Definitely.',
      'Absolutely not.',
      'I don’t know, try flipping a coin.',
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    await interaction.reply(`🎱 **Question:** ${question}\n**Answer:** ${answer}`);
  },
};
