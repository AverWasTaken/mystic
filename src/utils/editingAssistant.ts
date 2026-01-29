import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

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

const SYSTEM_PROMPT = `You are a friendly and knowledgeable video editing assistant. You help with questions about:
- Adobe After Effects (motion graphics, compositing, effects, expressions)
- Adobe Premiere Pro (editing, color grading, audio, workflows)
- DaVinci Resolve (editing, color, Fusion, Fairlight)
- General video editing concepts (transitions, pacing, storytelling)
- Codec and export settings
- Hardware recommendations for editing
- Tips and tricks for better edits

Be conversational, helpful, and encouraging. Keep responses concise but informative. If you don't know something, say so. Use examples when helpful. Feel free to ask clarifying questions if the user's question is vague.`;

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
      console.log(`[EditingAssistant] Conversation expired for user ${userId}`);
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
export async function handleEditingAssistant(message: Message): Promise<void> {
  const userId = message.author.id;
  
  // Extract the actual question (remove the bot mention)
  const botMentionRegex = /<@!?\d+>/g;
  const userMessage = message.content.replace(botMentionRegex, '').trim();
  
  // If they just pinged without a message
  if (!userMessage) {
    await message.reply({
      content: 'Hey! I\'m your editing assistant. 🎬 Ask me anything about video editing, After Effects, Premiere, or any editing software!',
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
        console.log(`[EditingAssistant] Conversation expired for user ${userId}`);
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

    // Split response if too long for Discord (2000 char limit)
    const maxLength = 1900; // Leave room for button
    const chunks: string[] = [];
    
    let remaining = assistantResponse;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      
      // Find a good break point
      let breakPoint = remaining.lastIndexOf('\n', maxLength);
      if (breakPoint === -1 || breakPoint < maxLength / 2) {
        breakPoint = remaining.lastIndexOf(' ', maxLength);
      }
      if (breakPoint === -1 || breakPoint < maxLength / 2) {
        breakPoint = maxLength;
      }
      
      chunks.push(remaining.slice(0, breakPoint));
      remaining = remaining.slice(breakPoint).trim();
    }

    // Send response(s)
    for (let i = 0; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const replyOptions: { content: string; components?: ActionRowBuilder<ButtonBuilder>[] } = {
        content: chunks[i]
      };
      
      // Only add button to last chunk
      if (isLastChunk) {
        replyOptions.components = [createEndButton()];
      }

      const reply = await message.reply(replyOptions);

      // Set up button collector only for the message with the button
      if (isLastChunk) {
        const collector = reply.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: (i) => i.customId === 'end_editing_conversation' && i.user.id === userId,
          time: CONVERSATION_TIMEOUT_MS,
          max: 1
        });

        collector.on('collect', async (interaction) => {
          clearConversation(userId);
          await interaction.update({
            content: chunks[i] + '\n\n*Conversation ended. Ping me again to start a new one!*',
            components: []
          });
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            // Just remove the button if it timed out
            try {
              await reply.edit({
                content: chunks[i],
                components: []
              });
            } catch {
              // Message may have been deleted
            }
          }
        });
      }
    }

  } catch (error) {
    console.error('[EditingAssistant] Error:', error);
    await message.reply({
      content: 'Sorry, I ran into an issue processing your request. Please try again!',
      components: [createEndButton()]
    });
  }
}

/**
 * Check if a message is a bot mention
 */
export function isBotMention(message: Message, botId: string): boolean {
  return message.mentions.has(botId) && !message.author.bot;
}
