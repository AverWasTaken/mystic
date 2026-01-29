const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Step 1: Log all command names being registered
console.log('🔍 Command Names Being Registered:');
commands.forEach((cmd, i) => console.log(`${i + 1}. /${cmd.name}`));

// Deploy
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`\n[1/2] Registering ${commands.length} slash command(s)...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('[2/2] Slash commands registered globally!');
  } catch (error) {
    console.error('\n❌ Error registering commands:');
    console.error(error);
  }
})();
