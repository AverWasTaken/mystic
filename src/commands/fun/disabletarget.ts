import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'disabletarget',
  description: 'Disable auto skull reaction',

  slashData: new SlashCommandBuilder()
    .setName('disabletarget')
    .setDescription('Disable auto skull reaction'),

  async execute(message: Message): Promise<void> {
    message.client.targetUserId = null;
    message.client.autoReactEnabled = false;
    await message.reply('⨳ Targeting disabled.');
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    interaction.client.targetUserId = null;
    interaction.client.autoReactEnabled = false;
    await interaction.reply('⨳ Targeting disabled.');
  }
};

export = command;
