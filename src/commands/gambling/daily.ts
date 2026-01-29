import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';
import { claimDaily } from '../../utils/economy';

function formatCooldown(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

const command: Command = {
  name: 'daily',
  description: 'Claim your daily coins (100-500)',

  slashData: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins (100-500)'),

  async execute(message: Message, args: string[]): Promise<void> {
    const result = await claimDaily(message.author.id);
    
    if (!result.success) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('⏰ Daily Cooldown')
        .setDescription(`You've already claimed your daily reward!\n\nTry again in **${formatCooldown(result.cooldownRemaining!)}**`)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎁 Daily Reward')
      .setDescription(`You claimed **${result.reward!.toLocaleString()}** coins!\n\nYour new balance: **${result.newBalance!.toLocaleString()}** coins`)
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const result = await claimDaily(interaction.user.id);
    
    if (!result.success) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('⏰ Daily Cooldown')
        .setDescription(`You've already claimed your daily reward!\n\nTry again in **${formatCooldown(result.cooldownRemaining!)}**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎁 Daily Reward')
      .setDescription(`You claimed **${result.reward!.toLocaleString()}** coins!\n\nYour new balance: **${result.newBalance!.toLocaleString()}** coins`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
