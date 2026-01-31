import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const BISCO_MESSAGE = 'bisco has been editing for 3 years. he does aesthetic, flow and mograph with aesthetic as his main style. you can check his stuff at https://www.biscovfx.com/';

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'bisco',
  description: 'Info about bisco!',

  slashData: new SlashCommandBuilder()
    .setName('bisco')
    .setDescription('Info about bisco!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }
    await message.reply(BISCO_MESSAGE);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }
    await interaction.reply(BISCO_MESSAGE);
  }
};

export = command;
