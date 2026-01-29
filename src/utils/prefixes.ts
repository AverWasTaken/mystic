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

// In-memory cache for prefixes (userId -> prefix)
const prefixCache = new Map<string, string>();
let cacheLoaded = false;
let lastCacheRefresh = 0;
const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const DEFAULT_PREFIX = "m!";

/**
 * Load all prefixes from Convex into the cache
 */
export async function loadPrefixCache(): Promise<void> {
  try {
    const allPrefixes = await getClient().query(api.prefixes.getAllPrefixes, {});
    prefixCache.clear();
    for (const [userId, prefix] of Object.entries(allPrefixes)) {
      prefixCache.set(userId, prefix);
    }
    cacheLoaded = true;
    lastCacheRefresh = Date.now();
  } catch (err) {
    console.error("Error loading prefix cache:", err);
  }
}

/**
 * Refresh cache if it's stale
 */
async function ensureCacheFresh(): Promise<void> {
  if (!cacheLoaded || Date.now() - lastCacheRefresh > CACHE_REFRESH_INTERVAL) {
    await loadPrefixCache();
  }
}

/**
 * Get a user's custom prefix from cache (fast, for message handler)
 */
export function getCachedPrefix(userId: string): string | null {
  return prefixCache.get(userId) ?? null;
}

/**
 * Check if a message starts with any valid prefix for the user
 * Returns the matched prefix or null
 */
export function getMatchedPrefix(content: string, userId: string): string | null {
  const customPrefix = getCachedPrefix(userId);
  
  // Check custom prefix first (if exists)
  if (customPrefix && content.startsWith(customPrefix)) {
    return customPrefix;
  }
  
  // Check default prefix
  if (content.startsWith(DEFAULT_PREFIX)) {
    return DEFAULT_PREFIX;
  }
  
  return null;
}

/**
 * Set a user's prefix (updates both cache and Convex)
 */
export async function setUserPrefix(userId: string, prefix: string): Promise<void> {
  await getClient().mutation(api.prefixes.setPrefix, { userId, prefix });
  prefixCache.set(userId, prefix);
}

/**
 * Remove a user's custom prefix (updates both cache and Convex)
 */
export async function removeUserPrefix(userId: string): Promise<{ removed: boolean }> {
  const result = await getClient().mutation(api.prefixes.removePrefix, { userId });
  if (result.removed) {
    prefixCache.delete(userId);
  }
  return result;
}

/**
 * Get a user's prefix from Convex (for display, not message checking)
 */
export async function getUserPrefix(userId: string): Promise<string | null> {
  return await getClient().query(api.prefixes.getPrefix, { userId });
}

/**
 * Initialize the prefix system - call on bot ready
 */
export async function initPrefixSystem(): Promise<void> {
  await loadPrefixCache();
  
  // Set up periodic refresh
  setInterval(async () => {
    await loadPrefixCache();
  }, CACHE_REFRESH_INTERVAL);
  
  console.log(`[PREFIX] Loaded ${prefixCache.size} custom prefixes into cache`);
}
