import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction
} from 'discord.js';
import type { Command } from '../../types';
import { getBalance, addBalance, subtractBalance, parseBetAmount, hasEnough } from '../../utils/economy';

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

interface GameState {
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  bet: number;
  userId: string;
}

const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      let numValue: number;
      if (value === 'A') numValue = 11;
      else if (['K', 'Q', 'J'].includes(value)) numValue = 10;
      else numValue = parseInt(value);
      
      deck.push({ suit, value, numValue });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCard(deck: Card[]): Card {
  return deck.pop()!;
}

function calculateHand(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  
  for (const card of hand) {
    total += card.numValue;
    if (card.value === 'A') aces++;
  }
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  
  return total;
}

function formatHand(hand: Card[], hideFirst = false): string {
  if (hideFirst) {
    return `🎴 ${hand.slice(1).map(c => `${c.value}${c.suit}`).join(' ')}`;
  }
  return hand.map(c => `${c.value}${c.suit}`).join(' ');
}

function createGameEmbed(
  game: GameState, 
  status: 'playing' | 'win' | 'lose' | 'push' | 'blackjack', 
  hideDealer = true,
  newBalance?: number
): EmbedBuilder {
  const playerTotal = calculateHand(game.playerHand);
  const dealerTotal = calculateHand(game.dealerHand);
  
  const colors = {
    playing: 0x0099FF,
    win: 0x00FF00,
    lose: 0xFF0000,
    push: 0xFFFF00,
    blackjack: 0xFFD700
  };

  const titles = {
    playing: '🃏 Blackjack',
    win: '🎉 You Win!',
    lose: '💸 You Lose!',
    push: '🤝 Push!',
    blackjack: '🎰 BLACKJACK!'
  };

  const embed = new EmbedBuilder()
    .setColor(colors[status])
    .setTitle(titles[status])
    .addFields(
      { 
        name: `Dealer's Hand ${hideDealer ? '' : `(${dealerTotal})`}`, 
        value: hideDealer ? formatHand(game.dealerHand, true) : formatHand(game.dealerHand),
        inline: false 
      },
      { 
        name: `Your Hand (${playerTotal})`, 
        value: formatHand(game.playerHand),
        inline: false 
      },
      { name: 'Bet', value: `${game.bet.toLocaleString()} coins`, inline: true }
    );

  if (status !== 'playing' && newBalance !== undefined) {
    let winnings = 0;
    if (status === 'blackjack') winnings = Math.floor(game.bet * 1.5);
    else if (status === 'win') winnings = game.bet;
    else if (status === 'push') winnings = 0;
    else winnings = -game.bet;

    embed.addFields(
      { name: winnings >= 0 ? 'Winnings' : 'Loss', value: `${Math.abs(winnings).toLocaleString()} coins`, inline: true },
      { name: 'New Balance', value: `${newBalance.toLocaleString()} coins`, inline: true }
    );
  }

  return embed;
}

function createButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('bj_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🃏')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🛑')
        .setDisabled(disabled)
    );
}

async function playDealerTurn(game: GameState): Promise<void> {
  while (calculateHand(game.dealerHand) < 17) {
    game.dealerHand.push(drawCard(game.deck));
  }
}

function determineOutcome(game: GameState): 'win' | 'lose' | 'push' | 'blackjack' {
  const playerTotal = calculateHand(game.playerHand);
  const dealerTotal = calculateHand(game.dealerHand);

  // Check for blackjack (21 with 2 cards)
  if (playerTotal === 21 && game.playerHand.length === 2) {
    if (dealerTotal === 21 && game.dealerHand.length === 2) return 'push';
    return 'blackjack';
  }

  if (playerTotal > 21) return 'lose';
  if (dealerTotal > 21) return 'win';
  if (playerTotal > dealerTotal) return 'win';
  if (playerTotal < dealerTotal) return 'lose';
  return 'push';
}

async function handleGameEnd(game: GameState, outcome: 'win' | 'lose' | 'push' | 'blackjack'): Promise<number> {
  if (outcome === 'blackjack') {
    return await addBalance(game.userId, Math.floor(game.bet * 2.5)); // Get back bet + 1.5x winnings
  } else if (outcome === 'win') {
    return await addBalance(game.userId, game.bet * 2); // Get back bet + winnings
  } else if (outcome === 'push') {
    return await addBalance(game.userId, game.bet); // Get back bet
  }
  // Lose = nothing returned (already subtracted)
  return await getBalance(game.userId);
}

async function runGame(game: GameState, reply: Message): Promise<void> {
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
    filter: (i: ButtonInteraction) => i.user.id === game.userId
  });

  collector.on('collect', async (interaction: ButtonInteraction) => {
    if (interaction.customId === 'bj_hit') {
      game.playerHand.push(drawCard(game.deck));
      const playerTotal = calculateHand(game.playerHand);

      if (playerTotal > 21) {
        collector.stop('bust');
        const newBalance = await handleGameEnd(game, 'lose');
        await interaction.update({
          embeds: [createGameEmbed(game, 'lose', false, newBalance)],
          components: [createButtons(true)]
        });
      } else if (playerTotal === 21) {
        collector.stop('21');
        await playDealerTurn(game);
        const outcome = determineOutcome(game);
        const newBalance = await handleGameEnd(game, outcome);
        await interaction.update({
          embeds: [createGameEmbed(game, outcome, false, newBalance)],
          components: [createButtons(true)]
        });
      } else {
        await interaction.update({
          embeds: [createGameEmbed(game, 'playing')],
          components: [createButtons()]
        });
      }
    } else if (interaction.customId === 'bj_stand') {
      collector.stop('stand');
      await playDealerTurn(game);
      const outcome = determineOutcome(game);
      const newBalance = await handleGameEnd(game, outcome);
      await interaction.update({
        embeds: [createGameEmbed(game, outcome, false, newBalance)],
        components: [createButtons(true)]
      });
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      // Auto-stand on timeout
      await playDealerTurn(game);
      const outcome = determineOutcome(game);
      const newBalance = await handleGameEnd(game, outcome);
      await reply.edit({
        embeds: [createGameEmbed(game, outcome, false, newBalance)],
        components: [createButtons(true)]
      });
    }
  });
}

const command: Command = {
  name: 'blackjack',
  description: 'Play a game of blackjack',

  slashData: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play a game of blackjack')
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('Amount to bet (or "all")')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length < 1) {
      await message.reply('❌ Usage: `m!blackjack <amount>` or `m!bj all`');
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

    // Deduct bet upfront
    await subtractBalance(message.author.id, betAmount);

    const deck = createDeck();
    const game: GameState = {
      playerHand: [drawCard(deck), drawCard(deck)],
      dealerHand: [drawCard(deck), drawCard(deck)],
      deck,
      bet: betAmount,
      userId: message.author.id
    };

    // Check for immediate blackjack
    const playerTotal = calculateHand(game.playerHand);
    if (playerTotal === 21) {
      const outcome = determineOutcome(game);
      const newBalance = await handleGameEnd(game, outcome);
      await message.reply({
        embeds: [createGameEmbed(game, outcome, false, newBalance)],
        components: [createButtons(true)]
      });
      return;
    }

    const reply = await message.reply({
      embeds: [createGameEmbed(game, 'playing')],
      components: [createButtons()]
    });

    await runGame(game, reply);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const amountInput = interaction.options.getString('amount', true);

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

    // Deduct bet upfront
    await subtractBalance(interaction.user.id, betAmount);

    const deck = createDeck();
    const game: GameState = {
      playerHand: [drawCard(deck), drawCard(deck)],
      dealerHand: [drawCard(deck), drawCard(deck)],
      deck,
      bet: betAmount,
      userId: interaction.user.id
    };

    // Check for immediate blackjack
    const playerTotal = calculateHand(game.playerHand);
    if (playerTotal === 21) {
      const outcome = determineOutcome(game);
      const newBalance = await handleGameEnd(game, outcome);
      await interaction.reply({
        embeds: [createGameEmbed(game, outcome, false, newBalance)],
        components: [createButtons(true)]
      });
      return;
    }

    const reply = await interaction.reply({
      embeds: [createGameEmbed(game, 'playing')],
      components: [createButtons()],
      fetchReply: true
    });

    // For slash commands, we need to handle the collector differently
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i: ButtonInteraction) => i.user.id === game.userId
    });

    collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
      if (buttonInteraction.customId === 'bj_hit') {
        game.playerHand.push(drawCard(game.deck));
        const total = calculateHand(game.playerHand);

        if (total > 21) {
          collector.stop('bust');
          const newBalance = await handleGameEnd(game, 'lose');
          await buttonInteraction.update({
            embeds: [createGameEmbed(game, 'lose', false, newBalance)],
            components: [createButtons(true)]
          });
        } else if (total === 21) {
          collector.stop('21');
          await playDealerTurn(game);
          const outcome = determineOutcome(game);
          const newBalance = await handleGameEnd(game, outcome);
          await buttonInteraction.update({
            embeds: [createGameEmbed(game, outcome, false, newBalance)],
            components: [createButtons(true)]
          });
        } else {
          await buttonInteraction.update({
            embeds: [createGameEmbed(game, 'playing')],
            components: [createButtons()]
          });
        }
      } else if (buttonInteraction.customId === 'bj_stand') {
        collector.stop('stand');
        await playDealerTurn(game);
        const outcome = determineOutcome(game);
        const newBalance = await handleGameEnd(game, outcome);
        await buttonInteraction.update({
          embeds: [createGameEmbed(game, outcome, false, newBalance)],
          components: [createButtons(true)]
        });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await playDealerTurn(game);
        const outcome = determineOutcome(game);
        const newBalance = await handleGameEnd(game, outcome);
        await interaction.editReply({
          embeds: [createGameEmbed(game, outcome, false, newBalance)],
          components: [createButtons(true)]
        });
      }
    });
  }
};

export = command;
