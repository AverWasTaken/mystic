import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'retard',
  description: 'sybau retard',

  slashData: new SlashCommandBuilder()
    .setName('retard')
    .setDescription('sybau retard')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to target (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first() ?? message.author;
    await message.reply(`🔥 <@${target.id}> sybau retard🥀`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') ?? interaction.user;
    await interaction.reply(`🔥 <@${target.id}> sybau retard🥀`);
  }
};

export = command;
