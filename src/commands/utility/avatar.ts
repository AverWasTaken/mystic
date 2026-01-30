import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const ORANGE = 0xE67E22;

const command: Command = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: 'Get a user\'s avatar',

  slashData: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get the avatar of')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    let user = message.mentions.users.first();
    
    // Try to get user by ID if no mention
    if (!user && args[0]) {
      try {
        user = await message.client.users.fetch(args[0]);
      } catch {
        // Invalid ID, ignore
      }
    }
    
    // Default to message author
    if (!user) {
      user = message.author;
    }

    const avatarUrl = user.displayAvatarURL({ size: 4096 });
    
    const embed = new EmbedBuilder()
      .setColor(ORANGE)
      .setTitle(`${user.displayName}'s Avatar`)
      .setImage(avatarUrl)
      .setFooter({ text: `Requested by ${message.author.displayName}` })
      .setTimestamp();

    // Add links for different formats
    const png = user.displayAvatarURL({ extension: 'png', size: 4096 });
    const jpg = user.displayAvatarURL({ extension: 'jpg', size: 4096 });
    const webp = user.displayAvatarURL({ extension: 'webp', size: 4096 });
    
    embed.setDescription(`[PNG](${png}) • [JPG](${jpg}) • [WebP](${webp})`);

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user') || interaction.user;

    const avatarUrl = user.displayAvatarURL({ size: 4096 });
    
    const embed = new EmbedBuilder()
      .setColor(ORANGE)
      .setTitle(`${user.displayName}'s Avatar`)
      .setImage(avatarUrl)
      .setFooter({ text: `Requested by ${interaction.user.displayName}` })
      .setTimestamp();

    const png = user.displayAvatarURL({ extension: 'png', size: 4096 });
    const jpg = user.displayAvatarURL({ extension: 'jpg', size: 4096 });
    const webp = user.displayAvatarURL({ extension: 'webp', size: 4096 });
    
    embed.setDescription(`[PNG](${png}) • [JPG](${jpg}) • [WebP](${webp})`);

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
