import { Client, Events, EmbedBuilder, TextChannel } from 'discord.js';

const WELCOME_CHANNEL_ID = '1466085574183096321';
const BOOSTER_PERKS_CHANNEL_ID = '1465872910723055770';
const BOOST_COLOR = 0xF47FFF; // Discord boost pink/purple

/**
 * Setup the boost thank you system
 * Detects when someone boosts and sends a thank you message
 */
export function setupBoostHandler(client: Client): void {
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      // Check if this is a NEW boost (premiumSince changed from null to a date)
      const wasBooster = oldMember.premiumSince !== null;
      const isBooster = newMember.premiumSince !== null;

      // Only trigger on NEW boosts, not existing boosters
      if (wasBooster || !isBooster) {
        return;
      }

      // User just boosted!
      const channel = newMember.guild.channels.cache.get(WELCOME_CHANNEL_ID) as TextChannel;

      if (!channel) {
        console.error(`[BOOST] Could not find welcome channel: ${WELCOME_CHANNEL_ID}`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(BOOST_COLOR)
        .setTitle('💜 New Server Boost!')
        .setDescription(
          `Thank you so much ${newMember} for boosting **${newMember.guild.name}**! 🚀\n\n` +
          `Your support means the world to us! Check out your booster perks here: <#${BOOSTER_PERKS_CHANNEL_ID}>`
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: `We now have ${newMember.guild.premiumSubscriptionCount} boosts!` })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log(`[BOOST] Thanked ${newMember.user.tag} for boosting!`);
    } catch (error) {
      console.error('[BOOST] Error handling boost:', error);
    }
  });

  console.log('[BOOST] Boost handler initialized');
}
