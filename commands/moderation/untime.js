// commands/moderation/untime.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untime')
    .setDescription('Removes a timeout from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove the timeout from')
        .setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('user');

    if (!member) {
      return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    }

    try {
      await member.timeout(null); // Removing timeout
      await interaction.reply(`✅ Timeout removed from ${member.user.tag}`);
    } catch (err) {
      await interaction.reply({ content: '❌ Failed to remove timeout.', ephemeral: true });
    }
  }
};
