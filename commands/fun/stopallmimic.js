const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopallmimic')
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
    }const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopallmimic')
    .setDescription('Stops all smart mimic targets for this server.'),
  async execute(interaction) {
    const guildId = interaction.guild.id;

    if (interaction.client.mimicTargets[guildId]) {
      interaction.client.mimicTargets[guildId].clear();
      await interaction.reply('🧹 Cleared all mimic targets for this server.');
    } else {
      await interaction.reply('There are no active mimic targets for this server.');
    }
  }
};


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
