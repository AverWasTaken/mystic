import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { Id } from "../../convex/_generated/dataModel";

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

const REMINDER_COLOR = 0xFFD700; // Gold

export interface ReminderData {
  _id: Id<"reminders">;
  userId: string;
  channelId: string;
  guildId: string;
  message: string;
  fireAt: number;
  createdAt: number;
  fired: boolean;
}

export async function createReminder(
  userId: string,
  channelId: string,
  guildId: string,
  message: string,
  fireAt: number
): Promise<Id<"reminders">> {
  return await getClient().mutation(api.reminders.createReminder, {
    userId,
    channelId,
    guildId,
    message,
    fireAt,
    createdAt: Date.now(),
  });
}

export async function getPendingReminders(): Promise<ReminderData[]> {
  return await getClient().query(api.reminders.getPendingReminders, {
    before: Date.now(),
  });
}

export async function markReminderFired(id: Id<"reminders">): Promise<void> {
  await getClient().mutation(api.reminders.markFired, { id });
}

export async function deleteReminder(id: Id<"reminders">): Promise<void> {
  await getClient().mutation(api.reminders.deleteReminder, { id });
}

export async function getUserReminders(userId: string): Promise<ReminderData[]> {
  return await getClient().query(api.reminders.getUserReminders, { userId });
}

// Parse time strings like "10m", "1h", "2d"
export function parseTimeString(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

export function formatTimeUntil(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// Start the reminder check loop
let reminderInterval: NodeJS.Timeout | null = null;

export function startReminderLoop(discordClient: Client): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  // Check every 30 seconds
  reminderInterval = setInterval(async () => {
    await checkAndFireReminders(discordClient);
  }, 30 * 1000);

  // Also check immediately
  checkAndFireReminders(discordClient);

  console.log('[REMINDERS] Reminder loop started (checking every 30s)');
}

export function stopReminderLoop(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[REMINDERS] Reminder loop stopped');
  }
}

async function checkAndFireReminders(discordClient: Client): Promise<void> {
  try {
    const pending = await getPendingReminders();

    for (const reminder of pending) {
      try {
        // Get the channel
        const channel = await discordClient.channels.fetch(reminder.channelId).catch(() => null);
        
        if (channel && channel.isTextBased() && 'send' in channel) {
          const embed = new EmbedBuilder()
            .setColor(REMINDER_COLOR)
            .setTitle('⏰ Reminder!')
            .setDescription(reminder.message)
            .setFooter({ text: `Set ${formatTimeAgo(reminder.createdAt)}` })
            .setTimestamp();

          await (channel as TextChannel).send({
            content: `<@${reminder.userId}>`,
            embeds: [embed],
          });

          console.log(`[REMINDERS] Fired reminder for user ${reminder.userId}`);
        } else {
          console.warn(`[REMINDERS] Could not find channel ${reminder.channelId} for reminder`);
        }

        // Mark as fired (even if channel not found, to prevent spam)
        await markReminderFired(reminder._id);
      } catch (err) {
        console.error(`[REMINDERS] Error firing reminder ${reminder._id}:`, err);
        // Still mark as fired to prevent infinite retries
        await markReminderFired(reminder._id);
      }
    }
  } catch (err) {
    console.error('[REMINDERS] Error checking reminders:', err);
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
