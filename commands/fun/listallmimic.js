const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listmimics')
    .setDescription('Lists users currently being mimicked in this server.'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const targets = interaction.client.mimicTargets[guildId];

    if (!targets || targets.size === 0) {
      await interaction.reply('No users are currently being mimicked.');
      return;
    }

    const usernames = await Promise.all(
      Array.from(targets).map(async id => {
        const user = await interaction.client.users.fetch(id).catch(() => null);
        return user ? `• ${user.tag}` : `• Unknown user (ID: ${id})`;
      })
    );

    await interaction.reply(`🤖 Currently mimicking:\n${usernames.join('\n')}`);
  }
};
