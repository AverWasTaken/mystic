import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';
import { addFeatureRequest, formatTimestamp } from '../../utils/featureRequests';

const PURPLE = 0x9B59B6;

const command: Command = {
  name: 'frequest',
  description: 'Submit a feature request for the bot',
  aliases: ['fr', 'featurerequest', 'suggest'],

  slashData: new SlashCommandBuilder()
    .setName('frequest')
    .setDescription('Submit a feature request for the bot')
    .addStringOption(option =>
      option
        .setName('request')
        .setDescription('Your feature request')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const requestText = args.join(' ').trim();
    
    if (!requestText) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Missing Request')
        .setDescription('Please provide a feature request!\n\n**Usage:** `m!frequest <your request>`')
        .setTimestamp();
      
      await message.reply({ embeds: [errorEmbed] });
      return;
    }

    if (requestText.length > 1000) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Request Too Long')
        .setDescription('Please keep your request under 1000 characters.')
        .setTimestamp();
      
      await message.reply({ embeds: [errorEmbed] });
      return;
    }

    const result = await addFeatureRequest(
      message.author.id,
      message.author.tag,
      requestText
    );

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('✨ Feature Request Submitted!')
      .setDescription(`Thank you for your suggestion! Our team will review it.`)
      .addFields(
        { name: '📝 Your Request', value: requestText },
        { name: '📅 Submitted', value: formatTimestamp(result.timestamp), inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const requestText = interaction.options.getString('request', true).trim();

    if (requestText.length > 1000) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Request Too Long')
        .setDescription('Please keep your request under 1000 characters.')
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const result = await addFeatureRequest(
      interaction.user.id,
      interaction.user.tag,
      requestText
    );

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('✨ Feature Request Submitted!')
      .setDescription(`Thank you for your suggestion! Our team will review it.`)
      .addFields(
        { name: '📝 Your Request', value: requestText },
        { name: '📅 Submitted', value: formatTimestamp(result.timestamp), inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
