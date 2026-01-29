const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🧹 Deleting GUILD commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    console.log('✅ GUILD commands cleared.');

    console.log('🧹 Deleting GLOBAL commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ GLOBAL commands cleared.');
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
})();
