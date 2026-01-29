const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🧹 Clearing commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] } // Empty array = remove all guild commands
    );
    console.log('✅ All guild commands deleted.');
  } catch (error) {
    console.error('❌ Error deleting commands:', error);
  }
})();
