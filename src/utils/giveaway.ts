import { Client, EmbedBuilder, TextChannel, Message } from 'discord.js';

export interface GiveawayData {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  hostId: string;
  endsAt: number;
  ended: boolean;
  winnerId?: string;
  timeout?: NodeJS.Timeout;
}

// In-memory storage for active giveaways
export const activeGiveaways = new Map<string, GiveawayData>();

const GIVEAWAY_COLOR = 0x9B59B6;

/**
 * Parse duration string to milliseconds
 * Supports: 30s, 5m, 1h, 1d, 1w
 */
export function parseDuration(durationStr: string): number | null {
  const match = durationStr.match(/^(\d+)([smhdw])$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Format milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Create giveaway embed
 */
export function createGiveawayEmbed(prize: string, hostId: string, endsAt: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎉 GIVEAWAY 🎉')
    .setDescription(`**${prize}**\n\nReact with 🎉 to enter!\nHosted by: <@${hostId}>`)
    .setColor(GIVEAWAY_COLOR)
    .setFooter({ text: 'Ends' })
    .setTimestamp(endsAt);
}

/**
 * Create ended giveaway embed
 */
export function createEndedEmbed(prize: string, winnerId: string | null, hostId: string): EmbedBuilder {
  const winnerText = winnerId ? `<@${winnerId}>` : 'No valid entries';
  
  return new EmbedBuilder()
    .setTitle('🎉 GIVEAWAY ENDED 🎉')
    .setDescription(`**${prize}**\n\nWinner: ${winnerText}\nHosted by: <@${hostId}>`)
    .setColor(GIVEAWAY_COLOR)
    .setFooter({ text: 'Ended' })
    .setTimestamp();
}

/**
 * End a giveaway and pick a winner
 */
export async function endGiveaway(client: Client, messageId: string): Promise<{ success: boolean; winnerId?: string; error?: string }> {
  const giveaway = activeGiveaways.get(messageId);
  if (!giveaway) {
    return { success: false, error: 'Giveaway not found' };
  }

  if (giveaway.ended) {
    return { success: false, error: 'Giveaway already ended' };
  }

  // Clear the timeout if it exists
  if (giveaway.timeout) {
    clearTimeout(giveaway.timeout);
  }

  try {
    const channel = await client.channels.fetch(giveaway.channelId) as TextChannel;
    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }

    const message = await channel.messages.fetch(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Get reactions
    const reaction = message.reactions.cache.get('🎉');
    let winnerId: string | null = null;

    if (reaction) {
      const users = await reaction.users.fetch();
      // Filter out bots and the host
      const validEntries = users.filter(u => !u.bot);
      
      if (validEntries.size > 0) {
        const entries = [...validEntries.values()];
        const winner = entries[Math.floor(Math.random() * entries.length)];
        winnerId = winner.id;
      }
    }

    // Update the embed
    const embed = createEndedEmbed(giveaway.prize, winnerId, giveaway.hostId);
    await message.edit({ embeds: [embed] });

    // Announce winner
    if (winnerId) {
      await channel.send(`🎉 Congratulations <@${winnerId}>! You won **${giveaway.prize}**!`);
    } else {
      await channel.send(`😢 No one entered the giveaway for **${giveaway.prize}**.`);
    }

    // Mark as ended
    giveaway.ended = true;
    giveaway.winnerId = winnerId || undefined;

    return { success: true, winnerId: winnerId || undefined };
  } catch (error) {
    console.error('Error ending giveaway:', error);
    return { success: false, error: 'Failed to end giveaway' };
  }
}

/**
 * Reroll a giveaway winner
 */
export async function rerollGiveaway(client: Client, messageId: string): Promise<{ success: boolean; winnerId?: string; error?: string }> {
  const giveaway = activeGiveaways.get(messageId);
  if (!giveaway) {
    return { success: false, error: 'Giveaway not found' };
  }

  if (!giveaway.ended) {
    return { success: false, error: 'Giveaway has not ended yet' };
  }

  try {
    const channel = await client.channels.fetch(giveaway.channelId) as TextChannel;
    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }

    const message = await channel.messages.fetch(messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Get reactions
    const reaction = message.reactions.cache.get('🎉');
    let winnerId: string | null = null;

    if (reaction) {
      const users = await reaction.users.fetch();
      // Filter out bots
      const validEntries = users.filter(u => !u.bot);
      
      if (validEntries.size > 0) {
        const entries = [...validEntries.values()];
        const winner = entries[Math.floor(Math.random() * entries.length)];
        winnerId = winner.id;
      }
    }

    if (winnerId) {
      giveaway.winnerId = winnerId;
      await channel.send(`🎉 New winner: <@${winnerId}>! Congratulations, you won **${giveaway.prize}**!`);
      return { success: true, winnerId };
    } else {
      return { success: false, error: 'No valid entries to reroll' };
    }
  } catch (error) {
    console.error('Error rerolling giveaway:', error);
    return { success: false, error: 'Failed to reroll giveaway' };
  }
}

/**
 * Schedule a giveaway to end
 */
export function scheduleGiveawayEnd(client: Client, messageId: string, delay: number): void {
  const giveaway = activeGiveaways.get(messageId);
  if (!giveaway) return;

  const timeout = setTimeout(async () => {
    await endGiveaway(client, messageId);
  }, delay);

  giveaway.timeout = timeout;
}
