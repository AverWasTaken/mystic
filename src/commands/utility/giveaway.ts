import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import type { Command } from '../../types';
import {
  parseDuration,
  formatDuration,
  createGiveawayEmbed,
  activeGiveaways,
  scheduleGiveawayEnd,
  GiveawayData
} from '../../utils/giveaway';

const command: Command = {
  name: 'giveaway',
  description: 'Start a giveaway',

  slashData: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g., 1h, 30m, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('What are you giving away?')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(message: Message, args: string[]): Promise<void> {
    // Check permissions
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply('❌ You need the **Manage Server** permission to start giveaways.');
      return;
    }

    if (!message.guild) {
      await message.reply('❌ Giveaways can only be started in servers.');
      return;
    }

    if (args.length < 2) {
      await message.reply('❌ Usage: `m!giveaway <duration> <prize>`\nExample: `m!giveaway 1h Discord Nitro`');
      return;
    }

    const durationStr = args[0];
    const prize = args.slice(1).join(' ');

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      await message.reply('❌ Invalid duration format. Use: `30s`, `5m`, `1h`, `1d`, `1w`');
      return;
    }

    if (durationMs < 10000) {
      await message.reply('❌ Giveaway must be at least 10 seconds long.');
      return;
    }

    if (durationMs > 30 * 24 * 60 * 60 * 1000) {
      await message.reply('❌ Giveaway cannot be longer than 30 days.');
      return;
    }

    const endsAt = Date.now() + durationMs;
    const embed = createGiveawayEmbed(prize, message.author.id, endsAt);

    const giveawayMessage = await (message.channel as TextChannel).send({ embeds: [embed] });
    await giveawayMessage.react('🎉');

    const giveawayData: GiveawayData = {
      messageId: giveawayMessage.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      prize,
      hostId: message.author.id,
      endsAt,
      ended: false,
    };

    activeGiveaways.set(giveawayMessage.id, giveawayData);
    scheduleGiveawayEnd(message.client, giveawayMessage.id, durationMs);

    await message.reply(`🎉 Giveaway started! Ends in **${formatDuration(durationMs)}**`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: '❌ Giveaways can only be started in servers.', ephemeral: true });
      return;
    }

    const durationStr = interaction.options.getString('duration', true);
    const prize = interaction.options.getString('prize', true);

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      await interaction.reply({ content: '❌ Invalid duration format. Use: `30s`, `5m`, `1h`, `1d`, `1w`', ephemeral: true });
      return;
    }

    if (durationMs < 10000) {
      await interaction.reply({ content: '❌ Giveaway must be at least 10 seconds long.', ephemeral: true });
      return;
    }

    if (durationMs > 30 * 24 * 60 * 60 * 1000) {
      await interaction.reply({ content: '❌ Giveaway cannot be longer than 30 days.', ephemeral: true });
      return;
    }

    const endsAt = Date.now() + durationMs;
    const embed = createGiveawayEmbed(prize, interaction.user.id, endsAt);

    await interaction.reply({ content: `🎉 Giveaway starting! Ends in **${formatDuration(durationMs)}**`, ephemeral: true });

    const channel = interaction.channel as TextChannel;
    const giveawayMessage = await channel.send({ embeds: [embed] });
    await giveawayMessage.react('🎉');

    const giveawayData: GiveawayData = {
      messageId: giveawayMessage.id,
      channelId: channel.id,
      guildId: interaction.guild.id,
      prize,
      hostId: interaction.user.id,
      endsAt,
      ended: false,
    };

    activeGiveaways.set(giveawayMessage.id, giveawayData);
    scheduleGiveawayEnd(interaction.client, giveawayMessage.id, durationMs);
  }
};

export = command;
