const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mystic')
    .setDescription('our servers invite!'),

  async execute(interaction) {
    await interaction.reply(`𝐌𝐲𝐬𝐭𝐢𝐜 is a brand new editing community with free presets and editing audios with scenepacks on the way. it has an active community and more importantly a friendly one. join 𝐌𝐲𝐬𝐭𝐢𝐜 now to improve your editing skills and meet new people. https://discord.gg/SCvdmx5WdP made by .biscovfx
  <@${interaction.user.id}>! `);
  },
};
