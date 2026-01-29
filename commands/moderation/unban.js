// commands/moderation/unban.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user by ID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The ID of the user to unban')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      await interaction.guild.members.unban(userId);
      await interaction.reply(`✅ Successfully unbanned <@${userId}>`);
    } catch (err) {
      await interaction.reply({ content: '❌ Failed to unban. Maybe invalid ID or not banned.', ephemeral: true });
    }
  }
};
