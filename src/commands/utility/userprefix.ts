import { Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';
import { setUserPrefix, removeUserPrefix, getCachedPrefix, DEFAULT_PREFIX } from '../../utils/prefixes';

const PURPLE = 0x9B59B6;
const MAX_PREFIX_LENGTH = 10;

const command: Command = {
  name: 'userprefix',
  description: 'Set a custom prefix for yourself',

  slashData: new SlashCommandBuilder()
    .setName('userprefix')
    .setDescription('Set a custom prefix for yourself')
    .addStringOption(option =>
      option
        .setName('prefix')
        .setDescription('Your custom prefix (or "reset" to remove)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const input = args.join(' ').trim();
    
    // No args - show current prefix
    if (!input) {
      const currentPrefix = getCachedPrefix(message.author.id);
      
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🔧 Your Prefix')
        .setDescription(currentPrefix 
          ? `Your custom prefix: \`${currentPrefix}\`\nDefault prefix: \`${DEFAULT_PREFIX}\`\n\nYou can use **either** prefix!`
          : `You're using the default prefix: \`${DEFAULT_PREFIX}\``)
        .setFooter({ text: 'Use m!userprefix <prefix> to set a custom prefix' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // Reset prefix
    if (input.toLowerCase() === 'reset') {
      const result = await removeUserPrefix(message.author.id);
      
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle(result.removed ? '✅ Prefix Reset' : 'ℹ️ No Custom Prefix')
        .setDescription(result.removed 
          ? `Your custom prefix has been removed.\nYou're now using the default prefix: \`${DEFAULT_PREFIX}\``
          : `You don't have a custom prefix set.\nYou're using the default prefix: \`${DEFAULT_PREFIX}\``)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // Validate prefix
    if (input.length > MAX_PREFIX_LENGTH) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Prefix Too Long')
        .setDescription(`Prefix must be ${MAX_PREFIX_LENGTH} characters or less.`)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    if (input.includes(' ')) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Invalid Prefix')
        .setDescription('Prefix cannot contain spaces.')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // Set the new prefix
    await setUserPrefix(message.author.id, input);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('✅ Prefix Set')
      .setDescription(`Your custom prefix is now: \`${input}\`\n\nYou can use **both** \`${input}\` and \`${DEFAULT_PREFIX}\` to run commands!`)
      .setFooter({ text: 'Use m!userprefix reset to remove your custom prefix' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const input = interaction.options.getString('prefix')?.trim() ?? '';

    // No input - show current prefix
    if (!input) {
      const currentPrefix = getCachedPrefix(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🔧 Your Prefix')
        .setDescription(currentPrefix 
          ? `Your custom prefix: \`${currentPrefix}\`\nDefault prefix: \`${DEFAULT_PREFIX}\`\n\nYou can use **either** prefix!`
          : `You're using the default prefix: \`${DEFAULT_PREFIX}\``)
        .setFooter({ text: 'Use /userprefix <prefix> to set a custom prefix' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Reset prefix
    if (input.toLowerCase() === 'reset') {
      const result = await removeUserPrefix(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle(result.removed ? '✅ Prefix Reset' : 'ℹ️ No Custom Prefix')
        .setDescription(result.removed 
          ? `Your custom prefix has been removed.\nYou're now using the default prefix: \`${DEFAULT_PREFIX}\``
          : `You don't have a custom prefix set.\nYou're using the default prefix: \`${DEFAULT_PREFIX}\``)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Validate prefix
    if (input.length > MAX_PREFIX_LENGTH) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Prefix Too Long')
        .setDescription(`Prefix must be ${MAX_PREFIX_LENGTH} characters or less.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (input.includes(' ')) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Invalid Prefix')
        .setDescription('Prefix cannot contain spaces.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Set the new prefix
    await setUserPrefix(interaction.user.id, input);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('✅ Prefix Set')
      .setDescription(`Your custom prefix is now: \`${input}\`\n\nYou can use **both** \`${input}\` and \`${DEFAULT_PREFIX}\` to run commands!`)
      .setFooter({ text: 'Use /userprefix reset to remove your custom prefix' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
