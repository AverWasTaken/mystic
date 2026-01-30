import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import type { Command } from '../../types';

const COURT_SYSTEM_PROMPT = `You are Judge Mystic, an AI judge presiding over the most dramatic courtroom in Discord history. You are theatrical, entertaining, and a bit unhinged. Your courtroom is CHAOS but you maintain order with an iron gavel.

Your job: Review the charges, dramatically question the absurdity of the situation, and deliver a verdict.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (use these exact headers):

**⚖️ COURT IS NOW IN SESSION ⚖️**

*The Honorable Judge Mystic presiding*

**📋 CHARGES:** [Summarize the charges dramatically]

**🔍 REVIEWING THE EVIDENCE...**
[2-3 sentences of dramatic courtroom commentary. Ask rhetorical questions. Be theatrical. Maybe gasp at the audacity.]

**🎭 VERDICT:**
[GUILTY or NOT GUILTY - make it dramatic]

**📜 SENTENCE:**
[If guilty: Give a silly sentence like "24 hours in the shadow realm", "must use only lowercase for 1 hour", "sentenced to touch grass immediately", "must change nickname to 'certified clown' for the day", etc. Be creative and funny!
If not guilty: Dismiss the case with some dramatic flair, maybe roast the plaintiff for wasting the court's time]

Keep it SHORT and punchy - this is entertainment, not an essay. Maximum 4-5 sentences per section. Be funny!`;

async function callOpenRouter(plaintiff: string, defendant: string, reason: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }

  const userMessage = `${plaintiff} is suing ${defendant} for the following reason: "${reason}"

Deliver your verdict, Judge Mystic!`;

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
        { role: 'system', content: COURT_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
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

const command: Command = {
  name: 'sue',
  description: 'Sue another user and let AI Judge Mystic decide the verdict!',

  slashData: new SlashCommandBuilder()
    .setName('sue')
    .setDescription('Sue another user and let AI Judge Mystic decide the verdict!')
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

      const verdict = await callOpenRouter(plaintiffName, defendantName, reason);

      const embed = new EmbedBuilder()
        .setColor(0x8B4513) // Brown/wood color for courthouse vibes
        .setTitle('🏛️ MYSTIC COURT OF DISCORD 🏛️')
        .setDescription(verdict)
        .addFields(
          { name: '👨‍⚖️ Plaintiff', value: `<@${message.author.id}>`, inline: true },
          { name: '👤 Defendant', value: `<@${defendant.id}>`, inline: true },
        )
        .setFooter({ text: '⚖️ Justice has been served • This is for entertainment only' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[Sue] Error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⚖️ Court Recess')
        .setDescription('The court is experiencing technical difficulties. Please try again later.');

      await message.reply({ embeds: [errorEmbed] });
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
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

      const verdict = await callOpenRouter(plaintiffName, defendantName, reason);

      const embed = new EmbedBuilder()
        .setColor(0x8B4513) // Brown/wood color for courthouse vibes
        .setTitle('🏛️ MYSTIC COURT OF DISCORD 🏛️')
        .setDescription(verdict)
        .addFields(
          { name: '👨‍⚖️ Plaintiff', value: `<@${interaction.user.id}>`, inline: true },
          { name: '👤 Defendant', value: `<@${defendant.id}>`, inline: true },
        )
        .setFooter({ text: '⚖️ Justice has been served • This is for entertainment only' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Sue] Error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⚖️ Court Recess')
        .setDescription('The court is experiencing technical difficulties. Please try again later.');

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

export = command;
