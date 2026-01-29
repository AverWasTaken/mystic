import { Client, Events, EmbedBuilder, TextChannel } from 'discord.js';

const WELCOME_CHANNEL_ID = '1466085574183096321';
const BANNER_URL = 'https://cdn.discordapp.com/attachments/802634004104216576/1466124146965741824/mystic_banner_00000.jpg?ex=697c42c3&is=697af143&hm=2b078eba6e2117c55627d41558826fd2270debdf5700b52df22afa46416b6b40&';
const PURPLE_COLOR = 0x9B59B6;

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Setup the welcome system for new members
 */
export function setupWelcome(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) as TextChannel;
      
      if (!channel) {
        console.error(`[WELCOME] Could not find welcome channel: ${WELCOME_CHANNEL_ID}`);
        return;
      }

      const memberCount = member.guild.memberCount;
      const ordinalCount = getOrdinalSuffix(memberCount);

      const embed = new EmbedBuilder()
        .setColor(PURPLE_COLOR)
        .setDescription(`Welcome ${member}! You are our **${ordinalCount}** member!`)
        .setImage(BANNER_URL);

      await channel.send({ embeds: [embed] });
      console.log(`[WELCOME] Welcomed ${member.user.tag} as member #${memberCount}`);
    } catch (error) {
      console.error('[WELCOME] Error sending welcome message:', error);
    }
  });

  console.log('[WELCOME] Welcome system initialized');
}
