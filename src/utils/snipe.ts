// Snipe utility - stores last deleted message per channel

export interface SnipeData {
  content: string;
  authorTag: string;
  authorAvatar: string | null;
  deletedAt: number;
}

// Map: channelId -> SnipeData
const snipeCache = new Map<string, SnipeData>();

// 5 minute expiry in milliseconds
const EXPIRY_MS = 5 * 60 * 1000;

/**
 * Store deleted message data for a channel
 */
export function setSnipe(channelId: string, data: SnipeData): void {
  snipeCache.set(channelId, data);
}

/**
 * Get snipe data for a channel
 * Returns null if no data exists or if expired (> 5 minutes old)
 */
export function getSnipe(channelId: string): SnipeData | null {
  const data = snipeCache.get(channelId);
  
  if (!data) return null;
  
  // Check if expired
  const age = Date.now() - data.deletedAt;
  if (age > EXPIRY_MS) {
    snipeCache.delete(channelId);
    return null;
  }
  
  return data;
}
