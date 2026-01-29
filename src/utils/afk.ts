import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

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

export interface AfkData {
  userId: string;
  message: string;
  timestamp: number;
}

export async function getAfk(userId: string): Promise<AfkData | null> {
  return await getClient().query(api.afk.getAfk, { userId });
}

export async function getAfkByIds(userIds: string[]): Promise<Record<string, { message: string; timestamp: number } | null>> {
  return await getClient().query(api.afk.getAfkByIds, { userIds });
}

export async function setAfk(userId: string, message: string): Promise<AfkData> {
  return await getClient().mutation(api.afk.setAfk, { userId, message });
}

export async function removeAfk(userId: string): Promise<{ removed: boolean; duration: number }> {
  return await getClient().mutation(api.afk.removeAfk, { userId });
}

export async function getAllAfk(): Promise<AfkData[]> {
  return await getClient().query(api.afk.getAllAfk, {});
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  if (hours % 24 > 0) {
    parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
  }
  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
  }
  if (parts.length === 0) {
    // Less than a minute
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  return parts.join(', ');
}
