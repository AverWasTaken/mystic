import { Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import type { Command } from '../../types';
import { getBalance, addBalance, subtractBalance, parseBetAmount, hasEnough } from '../../utils/economy';
import { isBooster, BOOSTER_GAMBLING_MULTIPLIER } from '../../utils/boosterCheck';

type CoinSide = 'heads' | 'tails';

function flipCoin(): CoinSide {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

function parseChoice(input: string): CoinSide | null {
  const lower = input.toLowerCase();
  if (lower === 'heads' || lower === 'h') return 'heads';
  if (lower === 'tails' || lower === 't') return 'tails';
  return null;
}

const command: Command = {
  name: 'cf',
  description: 'Flip a coin and bet on the outcome (alias for coinflip)',

  slashData: new SlashCommandBuilder()
    .setName('cf')
    .setDescription('Flip a coin and bet on the outcome')
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet (or "all")')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Your choice: heads or tails')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length < 2) {
      await message.reply('❌ Usage: `m!cf <amount> <heads/tails>` or `m!cf all heads`');
      return;
    }

    const betAmount = await parseBetAmount(message.author.id, args[0]);
    if (betAmount === null) {
      await message.reply('❌ Invalid bet amount. Use a positive number or "all".');
      return;
    }

    if (!(await hasEnough(message.author.id, betAmount))) {
      const balance = await getBalance(message.author.id);
      await message.reply(`❌ You don't have enough coins! Your balance: **${balance.toLocaleString()}** coins`);
      return;
    }

    const choice = parseChoice(args[1]);
    if (!choice) {
      await message.reply('❌ Invalid choice. Use `heads` (h) or `tails` (t).');
      return;
    }

    const member = message.member as GuildMember | null;
    const boosted = isBooster(member);
    const result = flipCoin();
    const won = result === choice;
    
    let newBalance: number;
    let actualWinnings = betAmount;
    let bonusText = '';
    
    if (won) {
      // Apply booster bonus to winnings
      if (boosted) {
        actualWinnings = Math.floor(betAmount * BOOSTER_GAMBLING_MULTIPLIER);
        bonusText = `\n🚀 **Booster Bonus: ${BOOSTER_GAMBLING_MULTIPLIER}x!** (+${(actualWinnings - betAmount).toLocaleString()} coins)`;
      }
      newBalance = await addBalance(message.author.id, actualWinnings);
    } else {
      newBalance = await subtractBalance(message.author.id, betAmount);
    }

    const emoji = result === 'heads' ? '🪙' : '⚪';
    const embed = new EmbedBuilder()
      .setColor(won ? (boosted ? 0xF47FFF : 0x00FF00) : 0xFF0000)
      .setTitle(`${emoji} Coinflip - ${result.toUpperCase()}!`)
      .setDescription(won 
        ? `🎉 You won **${actualWinnings.toLocaleString()}** coins!${bonusText}`
        : `💸 You lost **${betAmount.toLocaleString()}** coins...`)
      .addFields(
        { name: 'Your Choice', value: choice, inline: true },
        { name: 'Result', value: result, inline: true },
        { name: 'New Balance', value: `${newBalance.toLocaleString()} coins`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const amountInput = interaction.options.getString('amount', true);
    const choice = interaction.options.getString('choice', true) as CoinSide;

    const betAmount = await parseBetAmount(interaction.user.id, amountInput);
    if (betAmount === null) {
      await interaction.reply({ content: '❌ Invalid bet amount. Use a positive number or "all".', ephemeral: true });
      return;
    }

    if (!(await hasEnough(interaction.user.id, betAmount))) {
      const balance = await getBalance(interaction.user.id);
      await interaction.reply({ content: `❌ You don't have enough coins! Your balance: **${balance.toLocaleString()}** coins`, ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember | null;
    const boosted = isBooster(member);
    const result = flipCoin();
    const won = result === choice;
    
    let newBalance: number;
    let actualWinnings = betAmount;
    let bonusText = '';
    
    if (won) {
      // Apply booster bonus to winnings
      if (boosted) {
        actualWinnings = Math.floor(betAmount * BOOSTER_GAMBLING_MULTIPLIER);
        bonusText = `\n🚀 **Booster Bonus: ${BOOSTER_GAMBLING_MULTIPLIER}x!** (+${(actualWinnings - betAmount).toLocaleString()} coins)`;
      }
      newBalance = await addBalance(interaction.user.id, actualWinnings);
    } else {
      newBalance = await subtractBalance(interaction.user.id, betAmount);
    }

    const emoji = result === 'heads' ? '🪙' : '⚪';
    const embed = new EmbedBuilder()
      .setColor(won ? (boosted ? 0xF47FFF : 0x00FF00) : 0xFF0000)
      .setTitle(`${emoji} Coinflip - ${result.toUpperCase()}!`)
      .setDescription(won 
        ? `🎉 You won **${actualWinnings.toLocaleString()}** coins!${bonusText}`
        : `💸 You lost **${betAmount.toLocaleString()}** coins...`)
      .addFields(
        { name: 'Your Choice', value: choice, inline: true },
        { name: 'Result', value: result, inline: true },
        { name: 'New Balance', value: `${newBalance.toLocaleString()} coins`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

export = command;
