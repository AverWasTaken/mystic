const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bisco')
    .setDescription('Info about bisco!'),

  async execute(interaction) {
    await interaction.reply(`bisco has been editing for 3 years. he does aesthetic, flow and mograph with aesthetic as his main style. you can check his presets at his payhip https://payhip.com/bisco <@${interaction.user.id}>! `);
  },
};
