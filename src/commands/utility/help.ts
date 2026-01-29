import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import type { Command } from '../../types';

// ===================== Conversation State =====================

interface ContentPart {
  type: 'text';
  text: string;
}

interface ImagePart {
  type: 'image_url';
  image_url: { url: string };
}

type MessageContent = string | (ContentPart | ImagePart)[];

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: MessageContent;
}

interface Conversation {
  messages: ConversationMessage[];
  lastActivity: number;
  timeout: NodeJS.Timeout;
}

// Store active conversations (user ID -> conversation)
const conversations = new Map<string, Conversation>();

// Max messages to keep in context (user specified 20)
const MAX_MESSAGES = 20;

// Conversation timeout (20 minutes)
const CONVERSATION_TIMEOUT_MS = 20 * 60 * 1000;

const SYSTEM_PROMPT = `You are a helpful assistant for the Mystic Discord server. You can help with any questions users might have. Be friendly, concise, and helpful. If users share images, analyze them and help with whatever they need.`;

// ===================== OpenRouter API =====================

async function callOpenRouter(messages: ConversationMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mystic-bot',
      'X-Title': 'Mystic Discord Bot',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string | { type: string; text?: string }[] } }[];
  };

  const content = data.choices[0]?.message?.content;

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === 'text')
      .map((p) => p.text || '')
      .join('\n');
  }

  return 'No response content.';
}

// ===================== Conversation Management =====================

function clearConversation(userId: string): void {
  const conversation = conversations.get(userId);
  if (conversation) {
    clearTimeout(conversation.timeout);
    conversations.delete(userId);
  }
}

function resetTimeout(userId: string): void {
  const conversation = conversations.get(userId);
  if (conversation) {
    clearTimeout(conversation.timeout);
    conversation.timeout = setTimeout(() => {
      conversations.delete(userId);
      console.log(`[Help] Conversation expired for user ${userId}`);
    }, CONVERSATION_TIMEOUT_MS);
  }
}

function getOrCreateConversation(userId: string): Conversation {
  let conversation = conversations.get(userId);

  if (!conversation) {
    conversation = {
      messages: [],
      lastActivity: Date.now(),
      timeout: setTimeout(() => {
        conversations.delete(userId);
        console.log(`[Help] Conversation expired for user ${userId}`);
      }, CONVERSATION_TIMEOUT_MS),
    };
    conversations.set(userId, conversation);
  }

  return conversation;
}

// ===================== Image Processing =====================

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // Determine mime type from content-type header or URL
  const contentType = response.headers.get('content-type') || 'image/png';
  const mimeType = contentType.split(';')[0].trim();

  return `data:${mimeType};base64,${base64}`;
}

// ===================== Command =====================

const command: Command = {
  name: 'help',
  description: 'Ask for help with anything - supports text and images',

  slashData: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Ask for help with anything - supports text and images')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Your question or message')
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName('image')
        .setDescription('Attach an image for analysis')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('clear')
        .setDescription('Clear your conversation history')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const userId = message.author.id;
    const messageText = args.join(' ').trim() || null;
    const attachment = message.attachments.first();

    // Handle clear request
    if (messageText?.toLowerCase() === 'clear') {
      clearConversation(userId);
      await message.reply('🗑️ Your conversation history has been cleared.');
      return;
    }

    // Check if there's any input
    if (!messageText && !attachment) {
      const conversation = conversations.get(userId);
      const msgCount = conversation?.messages.length || 0;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🔮 Mystic Help')
        .setDescription(
          'Ask me anything! I can help with questions and analyze images.\n\n' +
            '**Usage:**\n' +
            '• `m!help your question` - Ask a question\n' +
            '• `m!help` + attach an image - Share an image for analysis\n' +
            '• `m!help your question` + attach image - Both together\n' +
            '• `m!help clear` - Clear your conversation history\n\n' +
            `📝 Your conversation: **${msgCount}/${MAX_MESSAGES}** messages\n` +
            '⏰ Conversations auto-clear after 20 minutes of inactivity.'
        )
        .setFooter({ text: 'Powered by Claude' });

      await message.reply({ embeds: [embed] });
      return;
    }

    // Show typing indicator since API call may take time
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    try {
      // Get or create conversation
      const conversation = getOrCreateConversation(userId);
      conversation.lastActivity = Date.now();
      resetTimeout(userId);

      // Build message content
      let userContent: MessageContent;

      if (attachment && attachment.contentType?.startsWith('image/')) {
        // Has image - need multimodal content
        const parts: (ContentPart | ImagePart)[] = [];

        if (messageText) {
          parts.push({ type: 'text', text: messageText });
        } else {
          parts.push({ type: 'text', text: 'What is in this image?' });
        }

        // Fetch and convert image to base64
        const dataUrl = await fetchImageAsBase64(attachment.url);
        parts.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        });

        userContent = parts;
      } else {
        // Text only
        userContent = messageText || 'Hello';
      }

      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: userContent,
      });

      // Trim history if too long (keep last MAX_MESSAGES messages)
      if (conversation.messages.length > MAX_MESSAGES) {
        conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
      }

      // Call OpenRouter API
      const assistantResponse = await callOpenRouter(conversation.messages);

      // Add assistant response to history
      conversation.messages.push({
        role: 'assistant',
        content: assistantResponse,
      });

      // Trim again after adding response
      if (conversation.messages.length > MAX_MESSAGES) {
        conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
      }

      // Send response
      const msgCount = conversation.messages.length;

      // Handle long responses (Discord limit is 2000 chars for regular messages)
      if (assistantResponse.length > 1900) {
        // Use embed for longer responses
        const embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setDescription(assistantResponse.slice(0, 4096))
          .setFooter({
            text: `Conversation: ${msgCount}/${MAX_MESSAGES} messages • Use m!help clear to reset`,
          });

        await message.reply({ embeds: [embed] });
      } else {
        // Short response - just text
        const footer = `\n-# 💬 ${msgCount}/${MAX_MESSAGES} • \`m!help clear\` to reset`;
        await message.reply(assistantResponse + footer);
      }
    } catch (error) {
      console.error('[Help] Error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ Error')
        .setDescription(
          'Something went wrong while processing your request. Please try again.'
        );

      await message.reply({ embeds: [errorEmbed] });
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const messageText = interaction.options.getString('message');
    const attachment = interaction.options.getAttachment('image');
    const clearHistory = interaction.options.getBoolean('clear');

    // Handle clear request
    if (clearHistory) {
      clearConversation(userId);
      await interaction.reply({
        content: '🗑️ Your conversation history has been cleared.',
        ephemeral: true,
      });
      return;
    }

    // Check if there's any input
    if (!messageText && !attachment) {
      const conversation = conversations.get(userId);
      const msgCount = conversation?.messages.length || 0;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🔮 Mystic Help')
        .setDescription(
          'Ask me anything! I can help with questions and analyze images.\n\n' +
            '**Usage:**\n' +
            '• `/help message:your question` - Ask a question\n' +
            '• `/help image:attachment` - Share an image for analysis\n' +
            '• `/help message:text image:attachment` - Both together\n' +
            '• `/help clear:true` - Clear your conversation history\n\n' +
            `📝 Your conversation: **${msgCount}/${MAX_MESSAGES}** messages\n` +
            '⏰ Conversations auto-clear after 20 minutes of inactivity.'
        )
        .setFooter({ text: 'Powered by Claude' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Defer reply since API call may take time
    await interaction.deferReply();

    try {
      // Get or create conversation
      const conversation = getOrCreateConversation(userId);
      conversation.lastActivity = Date.now();
      resetTimeout(userId);

      // Build message content
      let userContent: MessageContent;

      if (attachment) {
        // Has image - need multimodal content
        const parts: (ContentPart | ImagePart)[] = [];

        if (messageText) {
          parts.push({ type: 'text', text: messageText });
        } else {
          parts.push({ type: 'text', text: 'What is in this image?' });
        }

        // Fetch and convert image to base64
        const dataUrl = await fetchImageAsBase64(attachment.url);
        parts.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        });

        userContent = parts;
      } else {
        // Text only
        userContent = messageText || 'Hello';
      }

      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: userContent,
      });

      // Trim history if too long (keep last MAX_MESSAGES messages)
      if (conversation.messages.length > MAX_MESSAGES) {
        conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
      }

      // Call OpenRouter API
      const assistantResponse = await callOpenRouter(conversation.messages);

      // Add assistant response to history
      conversation.messages.push({
        role: 'assistant',
        content: assistantResponse,
      });

      // Trim again after adding response
      if (conversation.messages.length > MAX_MESSAGES) {
        conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
      }

      // Send response
      const msgCount = conversation.messages.length;

      // Handle long responses (Discord limit is 2000 chars for regular messages)
      if (assistantResponse.length > 1900) {
        // Use embed for longer responses
        const embed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setDescription(assistantResponse.slice(0, 4096))
          .setFooter({
            text: `Conversation: ${msgCount}/${MAX_MESSAGES} messages • Use /help clear:true to reset`,
          });

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Short response - just text
        const footer = `\n-# 💬 ${msgCount}/${MAX_MESSAGES} • \`/help clear:true\` to reset`;
        await interaction.editReply(assistantResponse + footer);
      }
    } catch (error) {
      console.error('[Help] Error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ Error')
        .setDescription(
          'Something went wrong while processing your request. Please try again.'
        );

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

export = command;
