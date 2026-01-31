import { Message, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const TIMEOUT_DURATION = 6 * 60 * 60 * 1000; // 6 hours in ms
const LOG_CHANNEL_ID = '1466338943753785390'; // staff-logs

// Build detection pattern for the slur (obfuscated)
// Base: n-i-g-g-a / n-i-g-g-e-r
const buildPattern = (): RegExp => {
  // Letter substitutions for evasion detection
  const n = '[nñ]';
  const i = '[i1!|lïíì]';
  const g = '[g9]';
  const a = '[a@4àáâã]';
  const e = '[e3èéêë]';
  const r = '[r]';
  
  // Optional separators between letters (NO spaces - too many false positives)
  const sep = '[\\-_.*]*';
  
  // Build patterns for variants - only the full slur, not short forms
  const softA = `${n}${sep}${i}${sep}${g}${sep}${g}${sep}${a}`;
  const hardR = `${n}${sep}${i}${sep}${g}${sep}${g}${sep}${e}${sep}${r}`;
  
  return new RegExp(`(${softA}|${hardR})`, 'i');
};

const slurPattern = buildPattern();

export async function checkAutomod(message: Message): Promise<boolean> {
  // Don't check bot messages
  if (message.author.bot) return false;
  
  // Don't check DMs
  if (!message.guild) return false;
  
  // Skip if user has mod permissions
  const member = message.member;
  if (member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return false;
  }
  
  // Check message content
  const content = message.content.toLowerCase();
  
  if (slurPattern.test(content)) {
    try {
      // Delete the message
      await message.delete();
      
      // Timeout the user
      if (member?.moderatable) {
        await member.timeout(TIMEOUT_DURATION, 'Automod: Racial slur detected');
      }
      
      // Send public shame embed in the channel
      try {
        if (message.channel.isTextBased() && 'send' in message.channel) {
          const publicEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚫 User Muted')
            .setDescription(`**${message.author.username}** has been muted for 6 hours.\n\n**Reason:** Racism is not tolerated here.`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
          
          await message.channel.send({ embeds: [publicEmbed] });
        }
      } catch (publicErr) {
        console.error('[Automod] Failed to send public embed:', publicErr);
      }

      // Log to staff channel
      try {
        const logChannel = await message.client.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel?.isTextBased() && 'send' in logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚫 Automod Action')
            .setDescription(`**User:** ${message.author.tag} (${message.author.id})\n**Action:** Message deleted + 6 hour timeout\n**Reason:** Racial slur detected\n**Channel:** <#${message.channel.id}>`)
            .setTimestamp();
          
          await logChannel.send({ embeds: [embed] });
        }
      } catch (logErr) {
        console.error('[Automod] Failed to log action:', logErr);
      }
      
      console.log(`[Automod] Deleted message and timed out ${message.author.tag}`);
      return true; // Message was handled
    } catch (err) {
      console.error('[Automod] Failed to take action:', err);
    }
  }
  
  return false;
}
