const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disabletarget')
        .setDescription('Disable auto skull reaction'),
    async execute(interaction) {
        interaction.client.clearTargetUser();
        await interaction.reply('⨳ Targeting disabled.');
    },
};
