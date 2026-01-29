// commands/fun/howgay.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('howgay')
    .setDescription('Calculates how gay a user is')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to analyze')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const gayPercentage = Math.floor(Math.random() * 101);

    await interaction.reply(`🌈 ${target.username} is **${gayPercentage}%** gay!`);
  }
};
