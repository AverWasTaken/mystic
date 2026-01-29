// commands/fun/retard.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retard')
    .setDescription('sybau retard')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to roast')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    
    const roasts = [
      "sybau retard🥀",
    ];

    const roast = roasts[Math.floor(Math.random() * roasts.length)];

    await interaction.reply(`🔥 <@${target.id}> ${roast}`);
  }
};
