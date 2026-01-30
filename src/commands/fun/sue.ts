import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import type { Command } from '../../types';

// ===================== Conversation State =====================

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CourtCase {
  plaintiffId: string;
  plaintiffName: string;
  defendantId: string;
  defendantName: string;
  reason: string;
  messages: ConversationMessage[];
  lastActivity: number;
  timeout: NodeJS.Timeout;
  lastBotMessageId: string | null;
}

// Store active court cases (channel ID -> case)
const activeCases = new Map<string, CourtCase>();

// Case timeout (5 minutes of inactivity)
const CASE_TIMEOUT_MS = 5 * 60 * 1000;

// Function to check if channel has an active case
function getActiveCase(channelId: string): CourtCase | undefined {
  return activeCases.get(channelId);
}

// Function to handle replies in the court case
async function handleCourtReply(message: Message): Promise<boolean> {
  const courtCase = activeCases.get(message.channel.id);
  if (!courtCase) return false;

  // Check if this is from plaintiff or defendant
  const isPlaintiff = message.author.id === courtCase.plaintiffId;
  const isDefendant = message.author.id === courtCase.defendantId;

  if (!isPlaintiff && !isDefendant) return false;

  // Check if they're replying to the judge's message
  if (!message.reference?.messageId) return false;
  if (message.reference.messageId !== courtCase.lastBotMessageId) return false;

  // Process this as a court response
  await processCourtResponse(message, courtCase, isPlaintiff);
  return true;
}

const COURT_SYSTEM_PROMPT = `You are Judge Mystic. Keep responses SHORT (2-4 sentences max). Be witty and dramatic but brief.

PLAINTIFF: {{PLAINTIFF_NAME}} | DEFENDANT: {{DEFENDANT_NAME}}
CHARGES: {{REASON}}

Rules:
- Ask quick questions, don't monologue
- One question at a time
- When ready to end, include "**CASE CLOSED**" with verdict (GUILTY/NOT GUILTY) and a silly sentence if guilty
- Keep it fun but concise`;

async function callOpenRouter(systemPrompt: string, messages: ConversationMessage[]): Promise<string> {
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
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.9,
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

  return 'The court is experiencing technical difficulties. Case dismissed!';
}

function buildSystemPrompt(courtCase: CourtCase): string {
  return COURT_SYSTEM_PROMPT
    .replace('{{PLAINTIFF_NAME}}', courtCase.plaintiffName)
    .replace('{{DEFENDANT_NAME}}', courtCase.defendantName)
    .replace('{{REASON}}', courtCase.reason);
}

function clearCase(channelId: string): void {
  const courtCase = activeCases.get(channelId);
  if (courtCase) {
    clearTimeout(courtCase.timeout);
    activeCases.delete(channelId);
  }
}

function resetTimeout(channelId: string, message: Message): void {
  const courtCase = activeCases.get(channelId);
  if (courtCase) {
    clearTimeout(courtCase.timeout);
    courtCase.timeout = setTimeout(async () => {
      activeCases.delete(channelId);
      console.log(`[Sue] Court case expired in channel ${channelId}`);
      
      try {
        const embed = new EmbedBuilder()
          .setColor(0x8B4513)
          .setTitle('🏛️ COURT ADJOURNED 🏛️')
          .setDescription('*The judge has left the courtroom due to inactivity.*\n\n**Case dismissed due to abandonment.** Both parties may file again if they wish to continue.')
          .setFooter({ text: '⚖️ Session expired after 5 minutes of inactivity' })
          .setTimestamp();
        
        if (message.channel.isTextBased() && 'send' in message.channel) {
          await message.channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('[Sue] Failed to send timeout message:', err);
      }
    }, CASE_TIMEOUT_MS);
  }
}

async function processCourtResponse(message: Message, courtCase: CourtCase, isPlaintiff: boolean): Promise<void> {
  // Update activity and reset timeout
  courtCase.lastActivity = Date.now();
  resetTimeout(message.channel.id, message);

  // Show typing
  if ('sendTyping' in message.channel) {
    await message.channel.sendTyping();
  }

  try {
    // Add the user's message to history with speaker identification
    const speakerLabel = isPlaintiff ? `[PLAINTIFF ${courtCase.plaintiffName}]` : `[DEFENDANT ${courtCase.defendantName}]`;
    courtCase.messages.push({
      role: 'user',
      content: `${speakerLabel}: ${message.content}`,
    });

    // Get AI response
    const systemPrompt = buildSystemPrompt(courtCase);
    const response = await callOpenRouter(systemPrompt, courtCase.messages);

    // Add response to history
    courtCase.messages.push({
      role: 'assistant',
      content: response,
    });

    // Check if case is closed
    const isCaseClosed = response.includes('CASE CLOSED');

    // Build embed
    const embed = new EmbedBuilder()
      .setColor(isCaseClosed ? 0x2F4F4F : 0x8B4513)
      .setTitle(isCaseClosed ? '🏛️ MYSTIC COURT - FINAL VERDICT 🏛️' : '🏛️ MYSTIC COURT OF DISCORD 🏛️')
      .setDescription(response.slice(0, 4096))
      .addFields(
        { name: '👨‍⚖️ Plaintiff', value: `<@${courtCase.plaintiffId}>`, inline: true },
        { name: '👤 Defendant', value: `<@${courtCase.defendantId}>`, inline: true },
      )
      .setTimestamp();

    if (isCaseClosed) {
      embed.setFooter({ text: '⚖️ This court session has concluded' });
      clearCase(message.channel.id);
    } else {
      embed.setFooter({ text: '⚖️ Reply to this message to respond to the judge • Case expires in 5 min' });
    }

    const sentMessage = await message.reply({ embeds: [embed] });
    
    if (!isCaseClosed) {
      courtCase.lastBotMessageId = sentMessage.id;
    }
  } catch (error) {
    console.error('[Sue] Error processing court response:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('⚖️ Court Recess')
      .setDescription('The court is experiencing technical difficulties. Please try again.');

    await message.reply({ embeds: [errorEmbed] });
  }
}

const command: Command = {
  name: 'sue',
  description: 'Sue another user and participate in an interactive court session!',

  slashData: new SlashCommandBuilder()
    .setName('sue')
    .setDescription('Sue another user and participate in an interactive court session!')
    .addUserOption((option) =>
      option
        .setName('defendant')
        .setDescription('The user you are suing')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for your lawsuit')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    // Check if there's already an active case in this channel
    if (activeCases.has(message.channel.id)) {
      await message.reply('⚖️ There\'s already an active court case in this channel! Wait for it to conclude or let it timeout.');
      return;
    }

    const defendant = message.mentions.users.first();

    if (!defendant) {
      await message.reply('⚖️ You need to mention someone to sue! Usage: `m!sue @user <reason>`');
      return;
    }

    // Get the reason (everything after the mention)
    const mentionPattern = /<@!?\d+>/;
    const reason = args
      .join(' ')
      .replace(mentionPattern, '')
      .trim();

    if (!reason) {
      await message.reply('⚖️ You need to provide a reason for your lawsuit! Usage: `m!sue @user <reason>`');
      return;
    }

    // Don't let people sue themselves
    if (defendant.id === message.author.id) {
      await message.reply('⚖️ You cannot sue yourself! That\'s just therapy with extra steps.');
      return;
    }

    // Show typing indicator
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    try {
      const plaintiffName = message.member?.displayName || message.author.displayName || message.author.username;
      const defendantName = message.guild?.members.cache.get(defendant.id)?.displayName || defendant.displayName || defendant.username;

      // Create the court case
      const courtCase: CourtCase = {
        plaintiffId: message.author.id,
        plaintiffName,
        defendantId: defendant.id,
        defendantName,
        reason,
        messages: [],
        lastActivity: Date.now(),
        timeout: setTimeout(() => {}, 0), // Will be set properly below
        lastBotMessageId: null,
      };

      // Add initial case message
      courtCase.messages.push({
        role: 'user',
        content: `A new case has been filed. ${plaintiffName} is suing ${defendantName} for: "${reason}". Please open the court session dramatically and begin questioning the parties.`,
      });

      // Store the case
      activeCases.set(message.channel.id, courtCase);
      resetTimeout(message.channel.id, message);

      // Get initial response from the judge
      const systemPrompt = buildSystemPrompt(courtCase);
      const response = await callOpenRouter(systemPrompt, courtCase.messages);

      // Add response to history
      courtCase.messages.push({
        role: 'assistant',
        content: response,
      });

      const embed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle('🏛️ MYSTIC COURT OF DISCORD 🏛️')
        .setDescription(response.slice(0, 4096))
        .addFields(
          { name: '👨‍⚖️ Plaintiff', value: `<@${message.author.id}>`, inline: true },
          { name: '👤 Defendant', value: `<@${defendant.id}>`, inline: true },
        )
        .setFooter({ text: '⚖️ Reply to this message to respond to the judge • Case expires in 5 min' })
        .setTimestamp();

      const sentMessage = await message.reply({ embeds: [embed] });
      courtCase.lastBotMessageId = sentMessage.id;

    } catch (error) {
      console.error('[Sue] Error:', error);
      clearCase(message.channel.id);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⚖️ Court Recess')
        .setDescription('The court is experiencing technical difficulties. Please try again later.');

      await message.reply({ embeds: [errorEmbed] });
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    // Check if there's already an active case in this channel
    if (activeCases.has(interaction.channelId)) {
      await interaction.reply({
        content: '⚖️ There\'s already an active court case in this channel! Wait for it to conclude or let it timeout.',
        ephemeral: true,
      });
      return;
    }

    const defendant = interaction.options.getUser('defendant', true);
    const reason = interaction.options.getString('reason', true);

    // Don't let people sue themselves
    if (defendant.id === interaction.user.id) {
      await interaction.reply({
        content: '⚖️ You cannot sue yourself! That\'s just therapy with extra steps.',
        ephemeral: true,
      });
      return;
    }

    // Defer reply since API call may take time
    await interaction.deferReply();

    try {
      const plaintiffName = interaction.member && 'displayName' in interaction.member
        ? interaction.member.displayName
        : interaction.user.displayName || interaction.user.username;

      const defendantMember = interaction.guild?.members.cache.get(defendant.id);
      const defendantName = defendantMember?.displayName || defendant.displayName || defendant.username;

      // Create the court case
      const courtCase: CourtCase = {
        plaintiffId: interaction.user.id,
        plaintiffName,
        defendantId: defendant.id,
        defendantName,
        reason,
        messages: [],
        lastActivity: Date.now(),
        timeout: setTimeout(() => {}, 0),
        lastBotMessageId: null,
      };

      // Add initial case message
      courtCase.messages.push({
        role: 'user',
        content: `A new case has been filed. ${plaintiffName} is suing ${defendantName} for: "${reason}". Please open the court session dramatically and begin questioning the parties.`,
      });

      // Store the case
      activeCases.set(interaction.channelId, courtCase);

      // Get initial response from the judge
      const systemPrompt = buildSystemPrompt(courtCase);
      const response = await callOpenRouter(systemPrompt, courtCase.messages);

      // Add response to history
      courtCase.messages.push({
        role: 'assistant',
        content: response,
      });

      const embed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle('🏛️ MYSTIC COURT OF DISCORD 🏛️')
        .setDescription(response.slice(0, 4096))
        .addFields(
          { name: '👨‍⚖️ Plaintiff', value: `<@${interaction.user.id}>`, inline: true },
          { name: '👤 Defendant', value: `<@${defendant.id}>`, inline: true },
        )
        .setFooter({ text: '⚖️ Reply to this message to respond to the judge • Case expires in 5 min' })
        .setTimestamp();

      const sentMessage = await interaction.editReply({ embeds: [embed] });
      courtCase.lastBotMessageId = sentMessage.id;

      // Set up timeout with a dummy message for the channel
      const channel = interaction.channel;
      if (channel && 'send' in channel) {
        courtCase.timeout = setTimeout(async () => {
          activeCases.delete(interaction.channelId);
          console.log(`[Sue] Court case expired in channel ${interaction.channelId}`);
          
          try {
            const timeoutEmbed = new EmbedBuilder()
              .setColor(0x8B4513)
              .setTitle('🏛️ COURT ADJOURNED 🏛️')
              .setDescription('*The judge has left the courtroom due to inactivity.*\n\n**Case dismissed due to abandonment.** Both parties may file again if they wish to continue.')
              .setFooter({ text: '⚖️ Session expired after 5 minutes of inactivity' })
              .setTimestamp();
            
            await channel.send({ embeds: [timeoutEmbed] });
          } catch (err) {
            console.error('[Sue] Failed to send timeout message:', err);
          }
        }, CASE_TIMEOUT_MS);
      }

    } catch (error) {
      console.error('[Sue] Error:', error);
      clearCase(interaction.channelId);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⚖️ Court Recess')
        .setDescription('The court is experiencing technical difficulties. Please try again later.');

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

module.exports = command;
module.exports.getActiveCase = getActiveCase;
module.exports.handleCourtReply = handleCourtReply;
