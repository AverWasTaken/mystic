import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'ping',
  description: 'Shows the bot\'s latency',

  slashData: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bot\'s latency'),

  async execute(message: Message): Promise<void> {
    const sent = await message.reply('🏓 Pinging...');
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;
    const wsLatency = message.client.ws.ping;

    await sent.edit(
      `🏓 **Pong!**\n` +
      `⏱️ Roundtrip: **${roundtrip}ms**\n` +
      `💓 WebSocket: **${wsLatency}ms**`
    );
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 **Pong!**\n` +
      `⏱️ Roundtrip: **${roundtrip}ms**\n` +
      `💓 WebSocket: **${wsLatency}ms**`
    );
  }
};

export = command;
