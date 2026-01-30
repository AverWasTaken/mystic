import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  EmbedBuilder,
  Guild,
  GuildVerificationLevel,
  ChannelType
} from 'discord.js';
import type { Command } from '../../types';

const ORANGE = 0xE67E22;

// Map verification levels to readable strings
const verificationLevelNames: Record<GuildVerificationLevel, string> = {
  [GuildVerificationLevel.None]: 'None',
  [GuildVerificationLevel.Low]: 'Low',
  [GuildVerificationLevel.Medium]: 'Medium',
  [GuildVerificationLevel.High]: 'High',
  [GuildVerificationLevel.VeryHigh]: 'Very High'
};

async function buildServerInfoEmbed(guild: Guild): Promise<EmbedBuilder> {
  // Fetch owner
  const owner = await guild.fetchOwner().catch(() => null);
  
  // Get channel counts
  const channels = guild.channels.cache;
  const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
  const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
  const forumChannels = channels.filter(c => c.type === ChannelType.GuildForum).size;
  const stageChannels = channels.filter(c => c.type === ChannelType.GuildStageVoice).size;
  
  // Creation date as Discord timestamp
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  
  // Build embed
  const embed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .setTimestamp();
  
  // Add description if server has one
  if (guild.description) {
    embed.setDescription(guild.description);
  }
  
  // Add banner if available
  if (guild.bannerURL()) {
    embed.setImage(guild.bannerURL({ size: 512 }));
  }
  
  // General Info
  embed.addFields(
    { 
      name: '📋 General', 
      value: [
        `**ID:** \`${guild.id}\``,
        `**Owner:** ${owner ? `<@${owner.id}>` : 'Unknown'}`,
        `**Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      ].join('\n'),
      inline: false 
    }
  );
  
  // Members
  const memberCount = guild.memberCount;
  embed.addFields(
    { 
      name: '👥 Members', 
      value: `**Total:** ${memberCount.toLocaleString()}`,
      inline: true 
    }
  );
  
  // Channels
  const channelLines = [
    `**Text:** ${textChannels}`,
    `**Voice:** ${voiceChannels}`,
    `**Categories:** ${categories}`
  ];
  if (forumChannels > 0) channelLines.push(`**Forums:** ${forumChannels}`);
  if (stageChannels > 0) channelLines.push(`**Stages:** ${stageChannels}`);
  
  embed.addFields(
    { 
      name: '💬 Channels', 
      value: channelLines.join('\n'),
      inline: true 
    }
  );
  
  // Roles
  embed.addFields(
    { 
      name: '🏷️ Roles', 
      value: `**Total:** ${guild.roles.cache.size}`,
      inline: true 
    }
  );
  
  // Boosts
  const boostTier = guild.premiumTier;
  const boostCount = guild.premiumSubscriptionCount || 0;
  const boostEmoji = boostTier > 0 ? '✨' : '💎';
  
  embed.addFields(
    { 
      name: `${boostEmoji} Boosts`, 
      value: [
        `**Level:** ${boostTier}`,
        `**Boosts:** ${boostCount}`
      ].join('\n'),
      inline: true 
    }
  );
  
  // Verification & Features
  const verificationLevel = verificationLevelNames[guild.verificationLevel] || 'Unknown';
  
  embed.addFields(
    { 
      name: '🔒 Security', 
      value: `**Verification:** ${verificationLevel}`,
      inline: true 
    }
  );
  
  // Emojis & Stickers
  const emojiCount = guild.emojis.cache.size;
  const stickerCount = guild.stickers.cache.size;
  
  embed.addFields(
    { 
      name: '😀 Assets', 
      value: [
        `**Emojis:** ${emojiCount}`,
        `**Stickers:** ${stickerCount}`
      ].join('\n'),
      inline: true 
    }
  );
  
  // Footer with server ID
  embed.setFooter({ 
    text: `Server ID: ${guild.id}`,
    iconURL: guild.iconURL() || undefined
  });
  
  return embed;
}

const command: Command = {
  name: 'serverinfo',
  description: 'Displays detailed information about the server',
  aliases: ['server', 'si', 'guildinfo'],

  slashData: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays detailed information about the server'),

  async execute(message: Message): Promise<void> {
    const guild = message.guild;
    if (!guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }
    
    const embed = await buildServerInfoEmbed(guild);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }
    
    const embed = await buildServerInfoEmbed(guild);
    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
