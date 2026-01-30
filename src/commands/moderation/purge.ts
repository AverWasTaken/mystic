import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel, Collection } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'purge',
  aliases: ['clear', 'prune'],
  description: 'Delete multiple messages at once',

  slashData: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply('You need the Manage Messages permission to use this command.');
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      await message.reply('Please provide a number between 1 and 100.');
      return;
    }

    const targetUser = message.mentions.users.first();
    const channel = message.channel as TextChannel;

    try {
      // Delete the command message first
      await message.delete().catch(() => {});

      // Fetch messages
      const fetched = await channel.messages.fetch({ limit: targetUser ? 100 : amount });
      let messages: Collection<string, Message<true>> = fetched;
      
      // Filter by user if specified
      if (targetUser) {
        const filtered = fetched.filter(m => m.author.id === targetUser.id);
        const arr = [...filtered.values()].slice(0, amount);
        messages = new Collection(arr.map(m => [m.id, m]));
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        const reply = await channel.send('No messages found to delete.');
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        return;
      }

      // Bulk delete
      const deleted = await channel.bulkDelete(messages, true);

      const reply = await channel.send(`🗑️ Deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}${targetUser ? ` from ${targetUser}` : ''}.`);
      setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (error) {
      console.error('[Purge] Error:', error);
      await channel.send('Failed to delete messages. Make sure they\'re not older than 14 days.').then(m => 
        setTimeout(() => m.delete().catch(() => {}), 3000)
      );
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch messages
      const fetched = await channel.messages.fetch({ limit: targetUser ? 100 : amount });
      let messages: Collection<string, Message<true>> = fetched;
      
      // Filter by user if specified
      if (targetUser) {
        const filtered = fetched.filter(m => m.author.id === targetUser.id);
        const arr = [...filtered.values()].slice(0, amount);
        messages = new Collection(arr.map(m => [m.id, m]));
      }

      // Filter out messages older than 14 days
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        await interaction.editReply('No messages found to delete.');
        return;
      }

      // Bulk delete
      const deleted = await channel.bulkDelete(messages, true);

      await interaction.editReply(`🗑️ Deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}${targetUser ? ` from ${targetUser}` : ''}.`);
    } catch (error) {
      console.error('[Purge] Error:', error);
      await interaction.editReply('Failed to delete messages. Make sure they\'re not older than 14 days.');
    }
  }
};

export = command;
