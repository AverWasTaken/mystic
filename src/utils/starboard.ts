import { EmbedBuilder, Message, TextChannel, PartialMessage, MessageReaction, PartialMessageReaction } from 'discord.js';

// Configuration
export const STARBOARD_CHANNEL_ID = '1466469752409952266';
export const STAR_THRESHOLD = 5;
export const STAR_EMOJIS = ['💀', '😭', '❤️'];
const STARBOARD_COLOR = 0xFFD700;

// Track posted messages: originalMessageId -> starboardMessageId
const starboardPosts = new Map<string, string>();

/**
 * Build the starboard embed for a message
 */
function buildStarboardEmbed(message: Message, starCount: number, emoji: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(STARBOARD_COLOR)
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL()
    })
    .setDescription(message.content || '*No text content*')
    .addFields({
      name: 'Source',
      value: `[Jump to message](${message.url})`,
      inline: true
    })
    .setFooter({ text: `${emoji} ${starCount} | #${(message.channel as TextChannel).name}` })
    .setTimestamp(message.createdAt);

  // Add first image attachment if present
  const imageAttachment = message.attachments.find(att => 
    att.contentType?.startsWith('image/')
  );
  if (imageAttachment) {
    embed.setImage(imageAttachment.url);
  }

  return embed;
}

/**
 * Handle a star reaction being added
 */
export async function handleStarboardReaction(
  reaction: MessageReaction | PartialMessageReaction
): Promise<void> {
  // Fetch partial reaction if needed
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('[Starboard] Failed to fetch reaction:', error);
      return;
    }
  }

  // Only handle starboard emojis
  const emojiName = reaction.emoji.name;
  if (!emojiName || !STAR_EMOJIS.includes(emojiName)) return;

  // Fetch partial message if needed
  let message = reaction.message;
  if (message.partial) {
    try {
      message = await message.fetch();
    } catch (error) {
      console.error('[Starboard] Failed to fetch message:', error);
      return;
    }
  }

  // Ignore bot messages and DMs
  if (message.author?.bot || !message.guild) return;

  // Don't starboard messages from the starboard channel
  if (message.channel.id === STARBOARD_CHANNEL_ID) return;

  const starCount = reaction.count || 0;

  // Check if below threshold
  if (starCount < STAR_THRESHOLD) return;

  // Get starboard channel
  const starboardChannel = message.guild.channels.cache.get(STARBOARD_CHANNEL_ID) as TextChannel | undefined;
  if (!starboardChannel) {
    console.error('[Starboard] Starboard channel not found:', STARBOARD_CHANNEL_ID);
    return;
  }

  const embed = buildStarboardEmbed(message as Message, starCount, emojiName);
  const existingPostId = starboardPosts.get(message.id);

  if (existingPostId) {
    // Update existing starboard post
    try {
      const existingPost = await starboardChannel.messages.fetch(existingPostId);
      await existingPost.edit({ embeds: [embed] });
      console.log(`[Starboard] Updated post for message ${message.id} (${starCount} stars)`);
    } catch (error) {
      // Post might have been deleted, remove from tracking and re-post
      console.warn('[Starboard] Could not update existing post, re-posting...');
      starboardPosts.delete(message.id);
      
      const newPost = await starboardChannel.send({ embeds: [embed] });
      starboardPosts.set(message.id, newPost.id);
      console.log(`[Starboard] Re-posted message ${message.id} (${starCount} stars)`);
    }
  } else {
    // Create new starboard post
    try {
      const starboardPost = await starboardChannel.send({ embeds: [embed] });
      starboardPosts.set(message.id, starboardPost.id);
      console.log(`[Starboard] Posted message ${message.id} to starboard (${starCount} stars)`);
    } catch (error) {
      console.error('[Starboard] Failed to post to starboard:', error);
    }
  }
}
