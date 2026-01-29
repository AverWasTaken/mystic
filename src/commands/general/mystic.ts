import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const MYSTIC_MESSAGE = `𝐌𝐲𝐬𝐭𝐢𝐜 is a brand new editing community with free presets and editing audios with scenepacks on the way. it has an active community and more importantly a friendly one. join 𝐌𝐲𝐬𝐭𝐢𝐜 now to improve your editing skills and meet new people. https://discord.gg/SCvdmx5WdP made by .biscovfx`;

const command: Command = {
  name: 'mystic',
  description: 'Our servers invite!',

  slashData: new SlashCommandBuilder()
    .setName('mystic')
    .setDescription('Our servers invite!'),

  async execute(message: Message): Promise<void> {
    await message.reply(`${MYSTIC_MESSAGE}
  <@${message.author.id}>!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply(`${MYSTIC_MESSAGE}
  <@${interaction.user.id}>!`);
  }
};

export = command;
