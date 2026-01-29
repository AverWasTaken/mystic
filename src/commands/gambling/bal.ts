import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { getBalance } from '../../utils/economy';

const command: Command = {
  name: 'bal',
  description: 'Check your coin balance (alias for balance)',

  slashData: new SlashCommandBuilder()
    .setName('bal')
    .setDescription('Check your coin balance')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check balance for (optional)')
        .setRequired(false)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const targetUser = message.mentions.users.first() || message.author;
    const balance = await getBalance(targetUser.id);
    
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('💰 Balance')
      .setDescription(`${targetUser.id === message.author.id ? 'You have' : `${targetUser.username} has`} **${balance.toLocaleString()}** coins`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const balance = await getBalance(targetUser.id);
    
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('💰 Balance')
      .setDescription(`${targetUser.id === interaction.user.id ? 'You have' : `${targetUser.username} has`} **${balance.toLocaleString()}** coins`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
