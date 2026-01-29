import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';
import { setAfk } from '../../utils/afk';

const PURPLE = 0x9B59B6;

const command: Command = {
  name: 'afk',
  description: 'Set your AFK status with an optional message',

  slashData: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status with an optional message')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Your AFK message (default: "AFK")')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const afkMessage = args.join(' ') || 'AFK';
    
    await setAfk(message.author.id, afkMessage);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('💤 AFK Set')
      .setDescription(`You are now AFK: **${afkMessage}**`)
      .setFooter({ text: 'Your AFK status will be removed when you send a message or react' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const afkMessage = interaction.options.getString('message') || 'AFK';
    
    await setAfk(interaction.user.id, afkMessage);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('💤 AFK Set')
      .setDescription(`You are now AFK: **${afkMessage}**`)
      .setFooter({ text: 'Your AFK status will be removed when you send a message or react' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
