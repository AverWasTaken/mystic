import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel
} from 'discord.js';
import type { Command } from '../../types';

const SUGGESTIONS_CHANNEL_ID = '1466724701782151268';
const SUGGESTION_COLOR = 0x9B59B6; // Purple

const command: Command = {
  name: 'suggest',
  description: 'Submit a suggestion for the server',

  slashData: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion for the server')
    .addStringOption(option =>
      option
        .setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)
    ) as SlashCommandBuilder,

  async execute(message: Message, args: string[]): Promise<void> {
    const suggestionText = args.join(' ').trim();

    if (!suggestionText) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Missing Suggestion')
            .setDescription('Usage: `m!suggest [your suggestion]`\n\nExample: `m!suggest Add a music channel!`')
        ]
      });
      return;
    }

    await submitSuggestion(message, suggestionText, message.author.displayName, message.author.displayAvatarURL());
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const suggestionText = interaction.options.getString('suggestion', true);

    await submitSuggestion(interaction, suggestionText, interaction.user.displayName, interaction.user.displayAvatarURL());
  }
};

async function submitSuggestion(
  context: Message | ChatInputCommandInteraction,
  suggestion: string,
  username: string,
  avatarUrl: string
): Promise<void> {
  const client = context.client;
  
  // Get the suggestions channel
  const suggestionsChannel = await client.channels.fetch(SUGGESTIONS_CHANNEL_ID).catch(() => null);
  
  if (!suggestionsChannel || !(suggestionsChannel instanceof TextChannel)) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF5555)
      .setTitle('❌ Error')
      .setDescription('Could not find the suggestions channel. Please contact an admin.');
    
    if (context instanceof Message) {
      await context.reply({ embeds: [errorEmbed] });
    } else {
      await context.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    return;
  }

  // Create the suggestion embed
  const suggestionEmbed = new EmbedBuilder()
    .setColor(SUGGESTION_COLOR)
    .setTitle('💡 New Suggestion')
    .setDescription(suggestion)
    .setFooter({ text: `Suggested by ${username}`, iconURL: avatarUrl })
    .setTimestamp();

  // Send the suggestion to the channel
  const suggestionMessage = await suggestionsChannel.send({ embeds: [suggestionEmbed] });

  // Add voting reactions
  await suggestionMessage.react('👍');
  await suggestionMessage.react('👎');

  // Confirm to the user
  const confirmEmbed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('✅ Suggestion Submitted!')
    .setDescription(`Your suggestion has been posted to <#${SUGGESTIONS_CHANNEL_ID}> for voting.`);

  if (context instanceof Message) {
    await context.reply({ embeds: [confirmEmbed] });
  } else {
    await context.reply({ embeds: [confirmEmbed], ephemeral: true });
  }
}

export = command;
