import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder,
  PollLayoutType
} from 'discord.js';
import type { Command } from '../../types';

const POLL_COLOR = 0x5865F2; // Discord blurple

const command: Command = {
  name: 'poll',
  description: 'Create a poll with a question and options',

  slashData: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll with a question and options')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('The poll question')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('options')
        .setDescription('Poll options separated by commas (up to 10)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Poll duration in hours (default: 1, max: 168/7 days)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(168)
    ) as SlashCommandBuilder,

  async execute(message: Message, args: string[]): Promise<void> {
    // Parse: !poll "question" option1, option2, option3
    const content = args.join(' ');
    
    // Try to extract question from quotes
    const quoteMatch = content.match(/^["'](.+?)["']\s*(.*)$/);
    
    if (!quoteMatch) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Invalid Format')
            .setDescription('Usage: `m!poll "Your question" option1, option2, option3`')
        ]
      });
      return;
    }

    const question = quoteMatch[1];
    const optionsStr = quoteMatch[2];
    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);

    if (options.length < 2) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Not Enough Options')
            .setDescription('You need at least 2 options for a poll.')
        ]
      });
      return;
    }

    if (options.length > 10) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Too Many Options')
            .setDescription('You can have at most 10 options.')
        ]
      });
      return;
    }

    await createPoll(message, question, options, 1);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const question = interaction.options.getString('question', true);
    const optionsStr = interaction.options.getString('options', true);
    const duration = interaction.options.getInteger('duration') ?? 1;

    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);

    if (options.length < 2) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Not Enough Options')
            .setDescription('You need at least 2 options for a poll.')
        ],
        ephemeral: true
      });
      return;
    }

    if (options.length > 10) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Too Many Options')
            .setDescription('You can have at most 10 options.')
        ],
        ephemeral: true
      });
      return;
    }

    // Validate option length (Discord limit is 55 chars per option)
    for (const opt of options) {
      if (opt.length > 55) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5555)
              .setTitle('❌ Option Too Long')
              .setDescription(`Option "${opt.substring(0, 20)}..." is too long. Max 55 characters per option.`)
          ],
          ephemeral: true
        });
        return;
      }
    }

    // Use Discord's native poll feature
    try {
      await interaction.reply({
        poll: {
          question: { text: question },
          answers: options.map(text => ({ text })),
          duration: duration,
          allowMultiselect: false,
          layoutType: PollLayoutType.Default
        }
      });
    } catch (error) {
      console.error('Failed to create poll:', error);
      // Fallback to embed-based poll if native poll fails
      await createEmbedPoll(interaction, question, options, duration);
    }
  }
};

async function createPoll(message: Message, question: string, options: string[], duration: number): Promise<void> {
  // Try native poll first
  try {
    if ('send' in message.channel) {
      await message.channel.send({
        poll: {
          question: { text: question },
          answers: options.map(text => ({ text })),
          duration: duration,
          allowMultiselect: false,
          layoutType: PollLayoutType.Default
        }
      });
      await message.react('✅');
    }
  } catch (error) {
    console.error('Native poll failed, using embed fallback:', error);
    await createEmbedPollMessage(message, question, options);
  }
}

async function createEmbedPoll(interaction: ChatInputCommandInteraction, question: string, options: string[], duration: number): Promise<void> {
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  const optionsList = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(POLL_COLOR)
    .setTitle(`📊 ${question}`)
    .setDescription(optionsList)
    .setFooter({ text: `Poll by ${interaction.user.displayName} • Ends in ${duration} hour(s)` })
    .setTimestamp();

  const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
  
  // Add reaction options
  for (let i = 0; i < options.length; i++) {
    await pollMessage.react(numberEmojis[i]);
  }
}

async function createEmbedPollMessage(message: Message, question: string, options: string[]): Promise<void> {
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  const optionsList = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(POLL_COLOR)
    .setTitle(`📊 ${question}`)
    .setDescription(optionsList)
    .setFooter({ text: `Poll by ${message.author.displayName}` })
    .setTimestamp();

  if ('send' in message.channel) {
    const pollMessage = await message.channel.send({ embeds: [embed] });
    
    // Add reaction options
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(numberEmojis[i]);
    }
  }
}

export = command;
