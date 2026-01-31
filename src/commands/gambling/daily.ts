import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import type { Command } from '../../types';
import { claimDaily } from '../../utils/economy';
import { isBooster, BOOSTER_DAILY_MULTIPLIER } from '../../utils/boosterCheck';

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
    const member = message.member as GuildMember | null;
    const boosted = isBooster(member);
    
    if (!result.success) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('⏰ Daily Cooldown')
        .setDescription(`You've already claimed your daily reward!\n\nTry again in **${formatCooldown(result.cooldownRemaining!)}**`)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // Apply booster bonus
    let finalReward = result.reward!;
    let bonusText = '';
    
    if (boosted) {
      const bonusAmount = finalReward; // Original amount is the bonus (2x total)
      finalReward = finalReward * BOOSTER_DAILY_MULTIPLIER;
      bonusText = `\n\n🚀 **Booster Bonus: ${BOOSTER_DAILY_MULTIPLIER}x!** (+${bonusAmount.toLocaleString()} coins)`;
      
      // Add the extra coins from booster bonus (result already has the base, need to add the bonus)
      const { addBalance } = await import('../../utils/economy');
      await addBalance(message.author.id, bonusAmount);
    }

    const embed = new EmbedBuilder()
      .setColor(boosted ? 0xF47FFF : 0x9B59B6) // Pink for boosters
      .setTitle(boosted ? '🚀 Daily Reward + Booster Bonus!' : '🎁 Daily Reward')
      .setDescription(`You claimed **${finalReward.toLocaleString()}** coins!${bonusText}\n\nYour new balance: **${(result.newBalance! + (boosted ? result.reward! : 0)).toLocaleString()}** coins`)
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const result = await claimDaily(interaction.user.id);
    const member = interaction.member as GuildMember | null;
    const boosted = isBooster(member);
    
    if (!result.success) {
      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('⏰ Daily Cooldown')
        .setDescription(`You've already claimed your daily reward!\n\nTry again in **${formatCooldown(result.cooldownRemaining!)}**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Apply booster bonus
    let finalReward = result.reward!;
    let bonusText = '';
    
    if (boosted) {
      const bonusAmount = finalReward; // Original amount is the bonus (2x total)
      finalReward = finalReward * BOOSTER_DAILY_MULTIPLIER;
      bonusText = `\n\n🚀 **Booster Bonus: ${BOOSTER_DAILY_MULTIPLIER}x!** (+${bonusAmount.toLocaleString()} coins)`;
      
      // Add the extra coins from booster bonus
      const { addBalance } = await import('../../utils/economy');
      await addBalance(interaction.user.id, bonusAmount);
    }

    const embed = new EmbedBuilder()
      .setColor(boosted ? 0xF47FFF : 0x9B59B6) // Pink for boosters
      .setTitle(boosted ? '🚀 Daily Reward + Booster Bonus!' : '🎁 Daily Reward')
      .setDescription(`You claimed **${finalReward.toLocaleString()}** coins!${bonusText}\n\nYour new balance: **${(result.newBalance! + (boosted ? result.reward! : 0)).toLocaleString()}** coins`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
