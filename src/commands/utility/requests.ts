import { 
  Message, 
  EmbedBuilder, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits
} from 'discord.js';
import type { Command } from '../../types';
import { getAllFeatureRequests, formatTimestamp, FeatureRequest } from '../../utils/featureRequests';

const PURPLE = 0x9B59B6;
const REQUESTS_PER_PAGE = 5;

function buildRequestsEmbed(requests: FeatureRequest[], page: number, totalPages: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('📋 Feature Requests')
    .setTimestamp();

  if (requests.length === 0) {
    embed.setDescription('No feature requests yet!');
    return embed;
  }

  const startIdx = page * REQUESTS_PER_PAGE;
  const endIdx = Math.min(startIdx + REQUESTS_PER_PAGE, requests.length);
  const pageRequests = requests.slice(startIdx, endIdx);

  const description = pageRequests.map((req, idx) => {
    const globalIdx = startIdx + idx + 1;
    const statusEmoji = req.status === 'pending' ? '🟡' : req.status === 'approved' ? '🟢' : '🔴';
    return `**#${globalIdx}** ${statusEmoji} <@${req.userId}>\n` +
           `> ${req.request.length > 100 ? req.request.substring(0, 100) + '...' : req.request}\n` +
           `*${formatTimestamp(req.timestamp)}*`;
  }).join('\n\n');

  embed.setDescription(description);
  embed.setFooter({ text: `Page ${page + 1}/${totalPages} • ${requests.length} total requests` });

  return embed;
}

function buildPaginationRow(page: number, totalPages: number, disabled: boolean = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('requests_first')
        .setLabel('⏪')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page === 0),
      new ButtonBuilder()
        .setCustomId('requests_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || page === 0),
      new ButtonBuilder()
        .setCustomId('requests_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || page >= totalPages - 1),
      new ButtonBuilder()
        .setCustomId('requests_last')
        .setLabel('⏩')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page >= totalPages - 1)
    );
}

const command: Command = {
  name: 'requests',
  description: 'View all feature requests (Staff only)',
  aliases: ['viewrequests', 'frlist'],

  slashData: new SlashCommandBuilder()
    .setName('requests')
    .setDescription('View all feature requests (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(message: Message): Promise<void> {
    // Check permissions
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Permission Denied')
        .setDescription('You need the **Manage Server** permission to view feature requests.')
        .setTimestamp();
      
      await message.reply({ embeds: [errorEmbed] });
      return;
    }

    const requests = await getAllFeatureRequests();
    const totalPages = Math.max(1, Math.ceil(requests.length / REQUESTS_PER_PAGE));
    let currentPage = 0;

    const embed = buildRequestsEmbed(requests, currentPage, totalPages);
    
    if (requests.length <= REQUESTS_PER_PAGE) {
      await message.reply({ embeds: [embed] });
      return;
    }

    const row = buildPaginationRow(currentPage, totalPages);
    const reply = await message.reply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000, // 2 minutes
      filter: (i) => i.user.id === message.author.id,
    });

    collector.on('collect', async (interaction) => {
      switch (interaction.customId) {
        case 'requests_first':
          currentPage = 0;
          break;
        case 'requests_prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'requests_next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'requests_last':
          currentPage = totalPages - 1;
          break;
      }

      const newEmbed = buildRequestsEmbed(requests, currentPage, totalPages);
      const newRow = buildPaginationRow(currentPage, totalPages);
      
      await interaction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', async () => {
      const finalEmbed = buildRequestsEmbed(requests, currentPage, totalPages);
      const disabledRow = buildPaginationRow(currentPage, totalPages, true);
      
      await reply.edit({ embeds: [finalEmbed], components: [disabledRow] }).catch(() => {});
    });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const requests = await getAllFeatureRequests();
    const totalPages = Math.max(1, Math.ceil(requests.length / REQUESTS_PER_PAGE));
    let currentPage = 0;

    const embed = buildRequestsEmbed(requests, currentPage, totalPages);
    
    if (requests.length <= REQUESTS_PER_PAGE) {
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const row = buildPaginationRow(currentPage, totalPages);
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on('collect', async (buttonInteraction) => {
      switch (buttonInteraction.customId) {
        case 'requests_first':
          currentPage = 0;
          break;
        case 'requests_prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'requests_next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'requests_last':
          currentPage = totalPages - 1;
          break;
      }

      const newEmbed = buildRequestsEmbed(requests, currentPage, totalPages);
      const newRow = buildPaginationRow(currentPage, totalPages);
      
      await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', async () => {
      const finalEmbed = buildRequestsEmbed(requests, currentPage, totalPages);
      const disabledRow = buildPaginationRow(currentPage, totalPages, true);
      
      await interaction.editReply({ embeds: [finalEmbed], components: [disabledRow] }).catch(() => {});
    });
  }
};

export = command;
