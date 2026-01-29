import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'serverinfo',
  description: 'Displays information about the server',

  slashData: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),

  async execute(message: Message): Promise<void> {
    const guild = message.guild;
    if (!guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }
    await message.reply(`📡 Server name: ${guild.name}\n👥 Members: ${guild.memberCount}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }
    await interaction.reply(`📡 Server name: ${guild.name}\n👥 Members: ${guild.memberCount}`);
  }
};

export = command;
