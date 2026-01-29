import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import Parser from 'rss-parser';
import fs from 'node:fs';
import path from 'node:path';

const TIKTOK_USER = 'bisco.vfx';
const RSS_FEED_URL = `https://rss-bridge.org/bridge01/?action=display&bridge=TikTokBridge&username=${TIKTOK_USER}&format=Atom`;
const NOTIFY_CHANNEL_ID = '1466443755027562516';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PURPLE_COLOR = 0x9B59B6;

const STATE_FILE_PATH = path.join(__dirname, '../../data/tiktok-state.json');

interface TikTokState {
  lastSeenId: string | null;
}

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/atom+xml, application/rss+xml, application/xml, text/xml, */*'
  }
});

/**
 * Load state from file
 */
function loadState(): TikTokState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[TIKTOK] Error loading state:', error);
  }
  return { lastSeenId: null };
}

/**
 * Save state to file
 */
function saveState(state: TikTokState): void {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[TIKTOK] Error saving state:', error);
  }
}

/**
 * Extract video ID from TikTok URL or use link as ID
 */
function extractVideoId(link: string): string {
  // TikTok URLs usually look like: https://www.tiktok.com/@user/video/1234567890
  const match = link.match(/\/video\/(\d+)/);
  return match ? match[1] : link;
}

/**
 * Check for new TikTok posts and send notifications
 */
async function checkForNewPosts(client: Client): Promise<void> {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    if (!feed.items || feed.items.length === 0) {
      console.log('[TIKTOK] No items in feed');
      return;
    }

    const state = loadState();
    const latestItem = feed.items[0];
    const latestId = extractVideoId(latestItem.link || latestItem.guid || '');

    // First run - just save the latest ID without notifying
    if (!state.lastSeenId) {
      console.log(`[TIKTOK] First run, saving latest video ID: ${latestId}`);
      state.lastSeenId = latestId;
      saveState(state);
      return;
    }

    // Check if there's a new post
    if (latestId !== state.lastSeenId) {
      console.log(`[TIKTOK] New post detected: ${latestId}`);

      // Find the notification channel
      const channel = client.channels.cache.get(NOTIFY_CHANNEL_ID) as TextChannel;
      if (!channel) {
        console.error(`[TIKTOK] Could not find notification channel: ${NOTIFY_CHANNEL_ID}`);
        return;
      }

      // Build the embed
      const embed = new EmbedBuilder()
        .setColor(PURPLE_COLOR)
        .setTitle(`🎬 New TikTok from ${TIKTOK_USER}!`)
        .setURL(latestItem.link || '')
        .setTimestamp();

      // Add description if available
      if (latestItem.title) {
        embed.setDescription(latestItem.title);
      }

      // Try to get thumbnail from enclosure or content
      let thumbnail = latestItem.enclosure?.url;
      
      // For Atom feeds, try to extract image from content
      if (!thumbnail && latestItem.content) {
        const imgMatch = latestItem.content.match(/src="([^"]+)"/);
        if (imgMatch) {
          thumbnail = imgMatch[1];
        }
      }
      
      if (thumbnail) {
        embed.setImage(thumbnail);
      }

      await channel.send({ embeds: [embed] });
      console.log(`[TIKTOK] Notification sent for video: ${latestId}`);

      // Update state
      state.lastSeenId = latestId;
      saveState(state);
    } else {
      console.log('[TIKTOK] No new posts');
    }
  } catch (error) {
    console.error('[TIKTOK] Error checking for new posts:', error);
  }
}

/**
 * Setup TikTok notification system
 */
export function setupTikTokNotify(client: Client): void {
  // Initial check after a short delay to ensure client is fully ready
  setTimeout(() => {
    checkForNewPosts(client);
  }, 5000);

  // Set up interval for periodic checks
  setInterval(() => {
    checkForNewPosts(client);
  }, POLL_INTERVAL_MS);

  console.log(`[TIKTOK] TikTok notification system initialized (polling every ${POLL_INTERVAL_MS / 1000 / 60} minutes)`);
}
