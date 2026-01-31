import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getInviteCount } from '../../utils/inviteTracker';

const command: Command = {
  name: 'invites',
  description: 'Check invite count for a user',

  slashData: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Check invite count for a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check invites for (defaults to yourself)')
        .setRequired(false)
    ) as SlashCommandBuilder,

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    // Get target user (mentioned or self)
    const targetUser = message.mentions.users.first() || message.author;
    
    const inviteCount = await getInviteCount(message.guild.id, targetUser.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: targetUser.tag,
        iconURL: targetUser.displayAvatarURL()
      })
      .setDescription(
        targetUser.id === message.author.id
          ? `You have **${inviteCount}** invite${inviteCount !== 1 ? 's' : ''}.`
          : `<@${targetUser.id}> has **${inviteCount}** invite${inviteCount !== 1 ? 's' : ''}.`
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    const inviteCount = await getInviteCount(interaction.guild.id, targetUser.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: targetUser.tag,
        iconURL: targetUser.displayAvatarURL()
      })
      .setDescription(
        targetUser.id === interaction.user.id
          ? `You have **${inviteCount}** invite${inviteCount !== 1 ? 's' : ''}.`
          : `<@${targetUser.id}> has **${inviteCount}** invite${inviteCount !== 1 ? 's' : ''}.`
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
