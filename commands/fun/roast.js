// commands/fun/roast.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Gives a random roast')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to roast')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    
    const roasts = [
      "you're the reason shampoo has instructions.",
      "you're the reason pluto lost its status",
      "if you fell you'd resplit pangea",
      "you're so obese you make ppl look skinny",
      "ur built like a solar eclipse",
      "you're the reason fridges have locks",
    ];

    const roast = roasts[Math.floor(Math.random() * roasts.length)];

    await interaction.reply(`🔥 <@${target.id}> ${roast}`);
  }
};
