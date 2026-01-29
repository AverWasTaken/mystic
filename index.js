// index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Global vars for auto-react
client.targetUserId = null;
client.autoReactEnabled = false;

// Store commands
client.commands = new Collection();
client.mimicTargets = {}; // guildId => Set of userIds

// Load commands dynamically
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(`[WARNING] Skipping broken command: ${filePath}`);
            }
        } catch (err) {
            console.error(`[ERROR] Failed to load ${filePath}`, err);
        }
    }
}

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error executing this command.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
        }
    }
});

// Auto-react listener
client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;

    // Auto-react to targeted user
    if (client.autoReactEnabled && message.author.id === client.targetUserId) {
        try {
            await message.react("💀");
            console.log(`Reacted to ${message.author.tag}'s message`);
        } catch (err) {
            console.error(`Failed to react: ${err}`);
        }
    }

    // Mimic logic
    const guildId = message.guild.id;
    const targets = client.mimicTargets[guildId];
    if (targets && targets.has(message.author.id)) {
        const text = message.content;
        if (!text.trim()) return;

        const mocked = text.split('')
            .map(char => Math.random() < 0.5 ? char.toLowerCase() : char.toUpperCase())
            .join('');

        await message.channel.send(mocked);
    }
});

client.once(Events.ClientReady, () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);