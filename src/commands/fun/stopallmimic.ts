import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'stopallmimic',
  description: 'Stops all smart mimic targets for this server.',

  slashData: new SlashCommandBuilder()
    .setName('stopallmimic')
    .setDescription('Stops all smart mimic targets for this server'),

  async execute(message: Message): Promise<void> {
    const guildId = message.guild?.id;

    if (!guildId) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    if (message.client.mimicTargets[guildId]) {
      message.client.mimicTargets[guildId].clear();
      await message.reply('🧹 Cleared all mimic targets for this server.');
    } else {
      await message.reply('There are no active mimic targets for this server.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    if (interaction.client.mimicTargets[guildId]) {
      interaction.client.mimicTargets[guildId].clear();
      await interaction.reply('🧹 Cleared all mimic targets for this server.');
    } else {
      await interaction.reply('There are no active mimic targets for this server.');
    }
  }
};

export = command;
