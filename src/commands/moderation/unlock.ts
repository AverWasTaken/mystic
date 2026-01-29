import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'unlock',
  description: 'Unlock the current channel. Usage: m!unlock [reason]',

  slashData: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unlocking the channel')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply('You do not have permission to manage channels.');
      return;
    }

    const channel = message.channel;
    if (!channel.isTextBased() || channel.isDMBased()) {
      await message.reply('This command can only be used in server text channels.');
      return;
    }

    const textChannel = channel as TextChannel;
    const everyoneRole = message.guild?.roles.everyone;

    if (!everyoneRole) {
      await message.reply('Could not find the @everyone role.');
      return;
    }

    const reason = args.join(' ') || 'No reason provided';

    try {
      await textChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      }, { reason: `Channel unlocked by ${message.author.tag}: ${reason}` });

      await message.reply(`🔓 This channel has been unlocked.\nReason: ${reason}`);
    } catch (err) {
      console.error(err);
      await message.reply('Failed to unlock the channel. Make sure I have the Manage Channels permission.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: 'This command can only be used in server text channels.', ephemeral: true });
      return;
    }

    const textChannel = channel as TextChannel;
    const everyoneRole = interaction.guild?.roles.everyone;

    if (!everyoneRole) {
      await interaction.reply({ content: 'Could not find the @everyone role.', ephemeral: true });
      return;
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await textChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      }, { reason: `Channel unlocked by ${interaction.user.tag}: ${reason}` });

      await interaction.reply(`🔓 This channel has been unlocked.\nReason: ${reason}`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to unlock the channel. Make sure I have the Manage Channels permission.', ephemeral: true });
    }
  }
};

export = command;
