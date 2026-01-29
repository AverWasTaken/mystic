import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  messages: ConversationMessage[];
  lastActivity: number;
  timeout: NodeJS.Timeout;
}

// Store active conversations (user ID -> conversation)
const conversations = new Map<string, Conversation>();

// Max messages to keep in context
const MAX_HISTORY = 10;

// Conversation timeout (10 minutes)
const CONVERSATION_TIMEOUT_MS = 10 * 60 * 1000;

const SYSTEM_PROMPT = `you're a chill assistant for the mystic discord server. keep it casual, lowercase vibes, no corporate speak. help with whatever people ask, whether it's questions, images, translations, whatever. be concise but helpful. don't be overly enthusiastic or use excessive punctuation. just be cool about it.`;

/**
 * Call OpenRouter API with Gemini model
 */
async function callOpenRouter(messages: ConversationMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/mystic-bot',
      'X-Title': 'Mystic Bot - Editing Assistant'
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
}

/**
 * Clear a user's conversation
 */
function clearConversation(userId: string): void {
  const conversation = conversations.get(userId);
  if (conversation) {
    clearTimeout(conversation.timeout);
    conversations.delete(userId);
  }
}

/**
 * Reset the inactivity timeout for a conversation
 */
function resetTimeout(userId: string): void {
  const conversation = conversations.get(userId);
  if (conversation) {
    clearTimeout(conversation.timeout);
    conversation.timeout = setTimeout(() => {
      conversations.delete(userId);
      console.log(`[ChillAssistant] Conversation expired for user ${userId}`);
    }, CONVERSATION_TIMEOUT_MS);
  }
}

/**
 * Create the end conversation button
 */
function createEndButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('end_editing_conversation')
      .setLabel('End Conversation')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );
}

/**
 * Handle a bot mention for the editing assistant
 */
export async function handleChillAssistant(message: Message): Promise<void> {
  const userId = message.author.id;
  
  // Extract the actual question (remove the bot mention)
  const botMentionRegex = /<@!?\d+>/g;
  let userMessage = message.content.replace(botMentionRegex, '').trim();
  
  // Check if replying to another user's message to help them
  let helpingOtherUser = false;
  let otherUserMention = '';
  if (message.reference?.messageId) {
    try {
      const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
      // If replying to someone else's message (not the bot), use their message as context
      if (repliedTo.author.id !== message.client.user?.id && !repliedTo.author.bot) {
        const helpKeywords = ['help', 'assist', 'answer', 'respond'];
        const isHelpRequest = helpKeywords.some(k => userMessage.toLowerCase().includes(k)) || !userMessage;
        if (isHelpRequest) {
          userMessage = repliedTo.content;
          helpingOtherUser = true;
          otherUserMention = `<@${repliedTo.author.id}>`;
        }
      }
    } catch {
      // Failed to fetch
    }
  }
  
  // If they just pinged without a message
  if (!userMessage) {
    const embed = new EmbedBuilder()
      .setDescription('Ask me anything about video editing!')
      .setColor(0x9B59B6);
    await message.reply({
      embeds: [embed],
      components: [createEndButton()]
    });
    return;
  }

  // Get or create conversation
  let conversation = conversations.get(userId);
  
  if (!conversation) {
    conversation = {
      messages: [],
      lastActivity: Date.now(),
      timeout: setTimeout(() => {
        conversations.delete(userId);
        console.log(`[ChillAssistant] Conversation expired for user ${userId}`);
      }, CONVERSATION_TIMEOUT_MS)
    };
    conversations.set(userId, conversation);
  }

  // Update activity and reset timeout
  conversation.lastActivity = Date.now();
  resetTimeout(userId);

  // Add user message to history
  conversation.messages.push({
    role: 'user',
    content: userMessage
  });

  // Trim history if too long (keep last MAX_HISTORY messages)
  if (conversation.messages.length > MAX_HISTORY) {
    conversation.messages = conversation.messages.slice(-MAX_HISTORY);
  }

  // Show typing indicator
  if ('sendTyping' in message.channel) {
    await message.channel.sendTyping();
  }

  try {
    // Call the API
    const assistantResponse = await callOpenRouter(conversation.messages);

    // Add assistant response to history
    conversation.messages.push({
      role: 'assistant',
      content: assistantResponse
    });

    // Trim again after adding response
    if (conversation.messages.length > MAX_HISTORY) {
      conversation.messages = conversation.messages.slice(-MAX_HISTORY);
    }

    // Create embed response
    const embed = new EmbedBuilder()
      .setDescription(assistantResponse.slice(0, 4096)) // Embed description limit
      .setColor(0x9B59B6);

    const replyContent = helpingOtherUser ? otherUserMention : undefined;
    const reply = await message.reply({
      content: replyContent,
      embeds: [embed],
      components: [createEndButton()]
    });

    // Set up button collector
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === 'end_editing_conversation' && i.user.id === userId,
      time: CONVERSATION_TIMEOUT_MS,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      clearConversation(userId);
      const endEmbed = new EmbedBuilder()
        .setDescription(assistantResponse.slice(0, 4000) + '\n\n*Conversation ended.*')
        .setColor(0x9B59B6);
      await interaction.update({
        embeds: [endEmbed],
        components: []
      });
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        try {
          await reply.edit({ components: [] });
        } catch {
          // Message may have been deleted
        }
      }
    });

  } catch (error) {
    console.error('[ChillAssistant] Error:', error);
    const errorEmbed = new EmbedBuilder()
      .setDescription('Something went wrong. Try again!')
      .setColor(0xE74C3C);
    await message.reply({
      embeds: [errorEmbed],
      components: [createEndButton()]
    });
  }
}

/**
 * Check if a message is a bot mention or reply to the bot
 */
export async function isBotMentionOrReply(message: Message, botId: string): Promise<boolean> {
  if (message.author.bot) return false;
  
  // Check for explicit @mention in message content (not reply mentions)
  const hasMentionInContent = message.content.includes(`<@${botId}>`) || message.content.includes(`<@!${botId}>`);
  if (hasMentionInContent) return true;
  
  // Reply to bot's message - only if user has an active conversation
  if (message.reference?.messageId && conversations.has(message.author.id)) {
    try {
      const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedTo.author.id === botId) return true;
    } catch {
      // Failed to fetch referenced message
    }
  }
  
  return false;
}
