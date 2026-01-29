// commands/fun/iq.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iq')
    .setDescription('Calculates the IQ of a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to calculate IQ for')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const iq = Math.floor(Math.random() * 161); // 0–160

    await interaction.reply(`🧠 ${target.username}'s IQ is **${iq}**!`);
  }
};
