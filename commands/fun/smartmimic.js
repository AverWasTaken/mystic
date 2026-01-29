const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smartmimic')
    .setDescription('Toggle smart mimic for a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to mimic')
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const guildId = interaction.guild.id;

    if (!interaction.client.mimicTargets[guildId]) {
      interaction.client.mimicTargets[guildId] = new Set();
    }

    const targets = interaction.client.mimicTargets[guildId];

    if (targets.has(target.id)) {
      targets.delete(target.id);
      await interaction.reply(`🛑 Stopped mimicking ${target.tag}`);
    } else {
      targets.add(target.id);
      await interaction.reply(`✅ Now mimicking ${target.tag}`);
    }
  }
};
