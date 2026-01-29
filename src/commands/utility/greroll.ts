import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';
import { rerollGiveaway, activeGiveaways } from '../../utils/giveaway';

const command: Command = {
  name: 'greroll',
  description: 'Reroll a giveaway winner',

  slashData: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Reroll a giveaway winner')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('The message ID of the giveaway')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(message: Message, args: string[]): Promise<void> {
    // Check permissions
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply('❌ You need the **Manage Server** permission to reroll giveaways.');
      return;
    }

    if (args.length < 1) {
      await message.reply('❌ Usage: `m!greroll <messageId>`');
      return;
    }

    const messageId = args[0];
    const giveaway = activeGiveaways.get(messageId);

    if (!giveaway) {
      await message.reply('❌ Giveaway not found. Make sure you provided the correct message ID.');
      return;
    }

    if (giveaway.guildId !== message.guild?.id) {
      await message.reply('❌ That giveaway is not in this server.');
      return;
    }

    if (!giveaway.ended) {
      await message.reply('❌ That giveaway has not ended yet. Use `m!gend` to end it first.');
      return;
    }

    const result = await rerollGiveaway(message.client, messageId);

    if (result.success) {
      await message.reply(`✅ Rerolled! New winner: <@${result.winnerId}>`);
    } else {
      await message.reply(`❌ Failed to reroll: ${result.error}`);
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = activeGiveaways.get(messageId);

    if (!giveaway) {
      await interaction.reply({ content: '❌ Giveaway not found. Make sure you provided the correct message ID.', ephemeral: true });
      return;
    }

    if (giveaway.guildId !== interaction.guild?.id) {
      await interaction.reply({ content: '❌ That giveaway is not in this server.', ephemeral: true });
      return;
    }

    if (!giveaway.ended) {
      await interaction.reply({ content: '❌ That giveaway has not ended yet. Use `/gend` to end it first.', ephemeral: true });
      return;
    }

    const result = await rerollGiveaway(interaction.client, messageId);

    if (result.success) {
      await interaction.reply({ content: `✅ Rerolled! New winner: <@${result.winnerId}>`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ Failed to reroll: ${result.error}`, ephemeral: true });
    }
  }
};

export = command;
