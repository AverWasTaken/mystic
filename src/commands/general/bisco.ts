import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const BISCO_MESSAGE = 'bisco has been editing for 3 years. he does aesthetic, flow and mograph with aesthetic as his main style. you can check his stuff at https://www.biscovfx.com/';

const command: Command = {
  name: 'bisco',
  description: 'Info about bisco!',

  slashData: new SlashCommandBuilder()
    .setName('bisco')
    .setDescription('Info about bisco!'),

  async execute(message: Message): Promise<void> {
    await message.reply(BISCO_MESSAGE);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply(BISCO_MESSAGE);
  }
};

export = command;
