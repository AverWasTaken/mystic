import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getSnipe } from '../../utils/snipe';

const PURPLE = 0x9B59B6;

const command: Command = {
  name: 'snipe',
  description: 'Shows the last deleted message in this channel',

  slashData: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Shows the last deleted message in this channel'),

  async execute(message: Message): Promise<void> {
    const snipeData = getSnipe(message.channel.id);

    if (!snipeData) {
      await message.reply('Nothing to snipe!');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setAuthor({
        name: snipeData.authorTag,
        iconURL: snipeData.authorAvatar || undefined
      })
      .setDescription(snipeData.content)
      .setFooter({ text: 'Deleted' })
      .setTimestamp(snipeData.deletedAt);

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const snipeData = getSnipe(interaction.channelId);

    if (!snipeData) {
      await interaction.reply('Nothing to snipe!');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setAuthor({
        name: snipeData.authorTag,
        iconURL: snipeData.authorAvatar || undefined
      })
      .setDescription(snipeData.content)
      .setFooter({ text: 'Deleted' })
      .setTimestamp(snipeData.deletedAt);

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
