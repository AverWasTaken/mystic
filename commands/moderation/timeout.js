const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member for a specific duration.')
    .addUserOption(option =>
      option.setName('target').setDescription('User to timeout').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration').setDescription('e.g. 10s, 1m, 1h, 1d').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    const duration = ms(durationStr);

    if (!member) {
      return interaction.reply({
        content: 'User not found.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!duration || duration < 5000 || duration > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: 'Invalid duration. Min: 5s, Max: 28d.',
        flags: MessageFlags.Ephemeral
      });
    }

    await member.timeout(duration, reason);
    await interaction.reply(`${user.tag} has been timed out for ${durationStr}.\nReason: ${reason}`);
  },
};
