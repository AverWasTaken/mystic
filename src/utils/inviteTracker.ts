import { Client, Collection, Invite, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Staff logs channel ID
const STAFF_LOGS_CHANNEL_ID = '1466338943753785390';

// Invite cache: guildId -> Map<inviteCode, uses>
const inviteCache = new Map<string, Map<string, number>>();

// Lazy-initialize Convex client
let _client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient {
  if (!_client) {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("CONVEX_URL environment variable is not set");
    }
    _client = new ConvexHttpClient(convexUrl);
  }
  return _client;
}

/**
 * Cache all invites for a guild
 */
async function cacheGuildInvites(client: Client, guildId: string): Promise<void> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const invites = await guild.invites.fetch();
    
    const guildInvites = new Map<string, number>();
    invites.forEach((invite: Invite) => {
      guildInvites.set(invite.code, invite.uses ?? 0);
    });
    
    inviteCache.set(guildId, guildInvites);
    console.log(`[INVITES] Cached ${guildInvites.size} invites for guild ${guild.name}`);
  } catch (err) {
    console.error(`[INVITES] Failed to cache invites for guild ${guildId}:`, err);
  }
}

/**
 * Initialize invite tracking - cache all guild invites
 */
export async function initInviteTracker(client: Client): Promise<void> {
  console.log('[INVITES] Initializing invite tracker...');
  
  for (const [guildId] of client.guilds.cache) {
    await cacheGuildInvites(client, guildId);
  }
  
  console.log('[INVITES] Invite tracker initialized');
}

/**
 * Find which invite was used when a member joins
 */
export async function handleMemberJoin(member: GuildMember): Promise<void> {
  const guild = member.guild;
  
  try {
    // Get current invites
    const currentInvites = await guild.invites.fetch();
    const cachedInvites = inviteCache.get(guild.id) || new Map();
    
    // Find the invite that was used (the one with increased uses)
    let usedInvite: Invite | null = null;
    let inviterTotalInvites = 0;
    
    for (const [code, invite] of currentInvites) {
      const cachedUses = cachedInvites.get(code) ?? 0;
      const currentUses = invite.uses ?? 0;
      
      if (currentUses > cachedUses) {
        usedInvite = invite;
        break;
      }
    }
    
    // Update cache with new invite counts
    const newCache = new Map<string, number>();
    currentInvites.forEach((invite: Invite) => {
      newCache.set(invite.code, invite.uses ?? 0);
    });
    inviteCache.set(guild.id, newCache);
    
    // Get the staff logs channel
    const staffLogsChannel = await member.client.channels.fetch(STAFF_LOGS_CHANNEL_ID).catch(() => null) as TextChannel | null;
    
    if (!staffLogsChannel) {
      console.error('[INVITES] Staff logs channel not found');
      return;
    }
    
    // Build the embed
    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord blurple
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL()
      })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();
    
    if (usedInvite && usedInvite.inviter) {
      const inviter = usedInvite.inviter;
      
      // Record the invite in Convex
      try {
        inviterTotalInvites = await getClient().mutation(api.invites.recordInvite, {
          guildId: guild.id,
          userId: member.id,
          inviterId: inviter.id,
          inviteCode: usedInvite.code,
        });
      } catch (err) {
        console.error('[INVITES] Failed to record invite in Convex:', err);
        // Fall back to getting the count separately
        try {
          inviterTotalInvites = await getClient().query(api.invites.getInviteCount, {
            guildId: guild.id,
            inviterId: inviter.id,
          });
          inviterTotalInvites++; // Account for this new invite
        } catch {
          inviterTotalInvites = 1;
        }
      }
      
      embed
        .setTitle('📨 Member Joined via Invite')
        .addFields(
          { name: '👤 Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: '📩 Invited by', value: `<@${inviter.id}> (${inviter.tag})`, inline: true },
          { name: '🔗 Invite Code', value: `\`${usedInvite.code}\``, inline: true },
          { name: '📊 Inviter Total', value: `**${inviterTotalInvites}** invite${inviterTotalInvites !== 1 ? 's' : ''}`, inline: true }
        );
    } else if (guild.vanityURLCode) {
      // Check if they might have used vanity URL
      embed
        .setTitle('📨 Member Joined')
        .addFields(
          { name: '👤 Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: '📩 Invited by', value: `Unknown (possibly vanity URL: \`${guild.vanityURLCode}\`)`, inline: false }
        );
    } else {
      // Unknown invite source
      embed
        .setTitle('📨 Member Joined')
        .addFields(
          { name: '👤 Member', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: '📩 Invited by', value: 'Unknown (invite expired or bot missing permissions)', inline: false }
        );
    }
    
    embed.setFooter({ text: `User ID: ${member.id}` });
    
    await staffLogsChannel.send({ embeds: [embed] });
    
  } catch (err) {
    console.error('[INVITES] Error handling member join:', err);
  }
}

/**
 * Get invite count for a user in a guild
 */
export async function getInviteCount(guildId: string, inviterId: string): Promise<number> {
  try {
    return await getClient().query(api.invites.getInviteCount, {
      guildId,
      inviterId,
    });
  } catch (err) {
    console.error('[INVITES] Failed to get invite count:', err);
    return 0;
  }
}

/**
 * Get top inviters for a guild
 */
export async function getTopInviters(guildId: string, limit = 10): Promise<Array<{ inviterId: string; count: number }>> {
  try {
    return await getClient().query(api.invites.getTopInviters, {
      guildId,
      limit,
    });
  } catch (err) {
    console.error('[INVITES] Failed to get top inviters:', err);
    return [];
  }
}

/**
 * Update invite cache when invites change
 */
export async function refreshInviteCache(client: Client, guildId: string): Promise<void> {
  await cacheGuildInvites(client, guildId);
}
