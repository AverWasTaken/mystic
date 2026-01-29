const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settarget')
        .setDescription('Enable or disable auto-react for a specific user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to target')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('enable')
                .setDescription('Enable or disable auto-react')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const enable = interaction.options.getBoolean('enable');

        // Save to global variables in index.js
        interaction.client.targetUserId = enable ? user.id : null;
        interaction.client.autoReactEnabled = enable;

        await interaction.reply({
            content: enable
                ? `⨳ ${interaction.user.tag} is targeting user **${user.tag}**`
                : '❌ Auto-react disabled',
            ephemeral: false
        });

        console.log(`AutoReact ${enable ? 'enabled' : 'disabled'} for user: ${user.tag} (${user.id})`);
    }
};
