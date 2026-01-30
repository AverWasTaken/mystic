import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  EmbedBuilder,
  GuildMember,
  User,
  UserFlags,
  Guild
} from 'discord.js';
import type { Command } from '../../types';

const ORANGE = 0xE67E22;

// Map user flags to readable badge names with emojis
const userFlagNames: Partial<Record<number, string>> = {
  [UserFlags.Staff]: '<:discord_staff:1234> Discord Staff',
  [UserFlags.Partner]: '<:partnered_server_owner:1234> Partner',
  [UserFlags.Hypesquad]: '🎉 HypeSquad Events',
  [UserFlags.BugHunterLevel1]: '🐛 Bug Hunter Level 1',
  [UserFlags.BugHunterLevel2]: '🐛 Bug Hunter Level 2',
  [UserFlags.HypeSquadOnlineHouse1]: '🏠 HypeSquad Bravery',
  [UserFlags.HypeSquadOnlineHouse2]: '🏠 HypeSquad Brilliance',
  [UserFlags.HypeSquadOnlineHouse3]: '🏠 HypeSquad Balance',
  [UserFlags.PremiumEarlySupporter]: '👑 Early Supporter',
  [UserFlags.VerifiedDeveloper]: '👨‍💻 Verified Bot Developer',
  [UserFlags.CertifiedModerator]: '🛡️ Certified Moderator',
  [UserFlags.ActiveDeveloper]: '🔧 Active Developer',
  [UserFlags.VerifiedBot]: '✅ Verified Bot',
  [UserFlags.BotHTTPInteractions]: '🤖 HTTP Interactions Bot'
};

// Simplified badge names for cleaner display
const badgeEmojis: Partial<Record<number, string>> = {
  [UserFlags.Staff]: '👨‍💼',
  [UserFlags.Partner]: '🤝',
  [UserFlags.Hypesquad]: '🎉',
  [UserFlags.BugHunterLevel1]: '🐛',
  [UserFlags.BugHunterLevel2]: '🐛',
  [UserFlags.HypeSquadOnlineHouse1]: '🛡️',
  [UserFlags.HypeSquadOnlineHouse2]: '💡',
  [UserFlags.HypeSquadOnlineHouse3]: '⚖️',
  [UserFlags.PremiumEarlySupporter]: '👑',
  [UserFlags.VerifiedDeveloper]: '👨‍💻',
  [UserFlags.CertifiedModerator]: '🛡️',
  [UserFlags.ActiveDeveloper]: '🔧',
  [UserFlags.VerifiedBot]: '✅',
  [UserFlags.BotHTTPInteractions]: '🤖'
};

function getBadges(user: User): string[] {
  const badges: string[] = [];
  const flags = user.flags?.toArray() || [];
  
  for (const flag of flags) {
    const flagValue = UserFlags[flag as keyof typeof UserFlags];
    if (typeof flagValue === 'number' && userFlagNames[flagValue]) {
      badges.push(userFlagNames[flagValue]!);
    }
  }
  
  return badges;
}

function getBadgeEmojis(user: User): string {
  const emojis: string[] = [];
  const flags = user.flags?.toArray() || [];
  
  for (const flag of flags) {
    const flagValue = UserFlags[flag as keyof typeof UserFlags];
    if (typeof flagValue === 'number' && badgeEmojis[flagValue]) {
      emojis.push(badgeEmojis[flagValue]!);
    }
  }
  
  return emojis.join(' ') || 'None';
}

function formatRoles(member: GuildMember, maxRoles: number = 10): string {
  // Filter out @everyone role
  const roles = member.roles.cache
    .filter(role => role.id !== member.guild.id)
    .sort((a, b) => b.position - a.position);
  
  if (roles.size === 0) return 'No roles';
  
  const roleArray = [...roles.values()];
  
  if (roleArray.length <= maxRoles) {
    return roleArray.map(r => `<@&${r.id}>`).join(', ');
  }
  
  const displayed = roleArray.slice(0, maxRoles).map(r => `<@&${r.id}>`).join(', ');
  const remaining = roleArray.length - maxRoles;
  return `${displayed} and ${remaining} more...`;
}

async function buildUserInfoEmbed(user: User, member: GuildMember | null, guild: Guild | null): Promise<EmbedBuilder> {
  // Force fetch user to get banner and accent color
  const fetchedUser = await user.fetch(true).catch(() => user);
  
  // Timestamps
  const createdTimestamp = Math.floor(user.createdTimestamp / 1000);
  const joinedTimestamp = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
  
  // Determine display name and color
  const displayName = member?.displayName || user.displayName || user.username;
  const embedColor = member?.displayHexColor !== '#000000' ? member?.displayColor || ORANGE : ORANGE;
  
  // Build embed
  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(displayName)
    .setThumbnail(member?.displayAvatarURL({ size: 256 }) || user.displayAvatarURL({ size: 256 }))
    .setTimestamp();
  
  // User identity section
  const identityLines = [
    `**Username:** ${user.username}${user.discriminator !== '0' ? `#${user.discriminator}` : ''}`,
    `**ID:** \`${user.id}\``
  ];
  
  // Add nickname if different from display name
  if (member && member.nickname && member.nickname !== user.username) {
    identityLines.splice(1, 0, `**Nickname:** ${member.nickname}`);
  }
  
  // Special tags
  const tags: string[] = [];
  if (user.bot) tags.push('🤖 Bot');
  if (guild && guild.ownerId === user.id) tags.push('👑 Server Owner');
  if (member?.premiumSince) tags.push('💎 Booster');
  
  if (tags.length > 0) {
    identityLines.push(`**Tags:** ${tags.join(' • ')}`);
  }
  
  embed.addFields({
    name: '👤 User',
    value: identityLines.join('\n'),
    inline: false
  });
  
  // Dates section
  const dateLines = [
    `**Account Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
  ];
  
  if (joinedTimestamp) {
    dateLines.push(`**Joined Server:** <t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)`);
  }
  
  embed.addFields({
    name: '📅 Dates',
    value: dateLines.join('\n'),
    inline: false
  });
  
  // Boost status if applicable
  if (member?.premiumSince) {
    const boostTimestamp = Math.floor(member.premiumSince.getTime() / 1000);
    embed.addFields({
      name: '💎 Boost Status',
      value: `**Boosting Since:** <t:${boostTimestamp}:F> (<t:${boostTimestamp}:R>)`,
      inline: false
    });
  }
  
  // Roles (only if in a guild)
  if (member) {
    const highestRole = member.roles.highest;
    const roleCount = member.roles.cache.size - 1; // Exclude @everyone
    
    embed.addFields({
      name: `🏷️ Roles [${roleCount}]`,
      value: formatRoles(member, 12),
      inline: false
    });
    
    if (highestRole.id !== guild?.id) {
      embed.addFields({
        name: '⭐ Highest Role',
        value: `<@&${highestRole.id}>`,
        inline: true
      });
    }
  }
  
  // Badges
  const badges = getBadges(fetchedUser);
  if (badges.length > 0) {
    embed.addFields({
      name: '🎖️ Badges',
      value: badges.join('\n'),
      inline: false
    });
  }
  
  // Avatar info
  const avatarLines: string[] = [];
  const globalAvatar = user.avatarURL({ size: 1024 });
  const serverAvatar = member?.avatar ? member.avatarURL({ size: 1024 }) : null;
  
  if (globalAvatar) {
    avatarLines.push(`[Global Avatar](${globalAvatar})`);
  }
  if (serverAvatar && serverAvatar !== globalAvatar) {
    avatarLines.push(`[Server Avatar](${serverAvatar})`);
  }
  
  // Banner
  const bannerUrl = fetchedUser.bannerURL({ size: 512 });
  if (bannerUrl) {
    avatarLines.push(`[Banner](${bannerUrl})`);
    embed.setImage(bannerUrl);
  } else if (fetchedUser.accentColor) {
    avatarLines.push(`**Accent Color:** #${fetchedUser.accentColor.toString(16).padStart(6, '0').toUpperCase()}`);
  }
  
  if (avatarLines.length > 0) {
    embed.addFields({
      name: '🖼️ Assets',
      value: avatarLines.join(' • '),
      inline: false
    });
  }
  
  // Footer
  embed.setFooter({ 
    text: `User ID: ${user.id}`,
    iconURL: user.displayAvatarURL()
  });
  
  return embed;
}

async function resolveUser(
  guild: Guild | null, 
  input: string | null
): Promise<{ user: User; member: GuildMember | null } | null> {
  if (!input) return null;
  
  // Clean the input
  const cleanInput = input.trim();
  
  // Try to extract ID from mention
  const mentionMatch = cleanInput.match(/^<@!?(\d+)>$/);
  const userId = mentionMatch ? mentionMatch[1] : cleanInput;
  
  // Check if it's a valid snowflake (Discord ID)
  if (!/^\d{17,19}$/.test(userId)) {
    return null;
  }
  
  // Try to get from guild first
  if (guild) {
    try {
      const member = await guild.members.fetch(userId);
      return { user: member.user, member };
    } catch {
      // Member not in guild, try to fetch user directly
    }
  }
  
  return null;
}

const command: Command = {
  name: 'userinfo',
  description: 'Displays detailed information about a user',
  aliases: ['user', 'ui', 'whois'],

  slashData: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays detailed information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get info about (defaults to you)')
        .setRequired(false)
    ),

  async execute(message: Message): Promise<void> {
    const guild = message.guild;
    
    // Get target user
    let user: User;
    let member: GuildMember | null = null;
    
    // Check for mentioned user first
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      user = mentionedUser;
      member = message.mentions.members?.first() || null;
    } else {
      // Check for user ID argument
      const args = message.content.split(/\s+/).slice(1);
      if (args.length > 0) {
        const resolved = await resolveUser(guild, args[0]);
        if (resolved) {
          user = resolved.user;
          member = resolved.member;
        } else {
          // If can't resolve, default to message author
          user = message.author;
          member = message.member;
        }
      } else {
        // Default to message author
        user = message.author;
        member = message.member;
      }
    }
    
    const embed = await buildUserInfoEmbed(user, member, guild);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild;
    
    // Get target user
    const targetUser = interaction.options.getUser('user');
    const user = targetUser || interaction.user;
    
    // Get member if in guild
    let member: GuildMember | null = null;
    if (guild) {
      if (targetUser) {
        member = interaction.options.getMember('user') as GuildMember | null;
      } else {
        member = interaction.member as GuildMember | null;
      }
    }
    
    const embed = await buildUserInfoEmbed(user, member, guild);
    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
