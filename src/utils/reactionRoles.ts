import { Client, Events, GatewayIntentBits } from 'discord.js';

// Reaction role mappings: messageId -> { emoji: roleId }
const reactionRoles: Record<string, Record<string, string>> = {
  // Editing Software
  '1466437385926742058': {
    '🔷': '1466099626846322823', // After Effects
    '📱': '1466099663206875248', // Alight Motion
    '✂️': '1466099691442798766', // Capcut
    '⭐': '1466099711898292316', // Videostar
  },
  // Audio Pings
  '1466437394772529460': {
    '🎨': '1466107415970709768', // Aesthetic audio ping
    '💥': '1466107468189798431', // Shake audio ping
    '🎞️': '1466107497562505327', // Film audio ping
  },
};

export function setupReactionRoles(client: Client): void {
  // Handle reaction add
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    
    // Fetch partial reactions
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }
    
    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name;
    
    if (!emoji || !reactionRoles[messageId]) return;
    
    const roleId = reactionRoles[messageId][emoji];
    if (!roleId) return;
    
    try {
      const guild = reaction.message.guild;
      if (!guild) return;
      
      const member = await guild.members.fetch(user.id);
      await member.roles.add(roleId);
      console.log(`[ReactionRoles] Added role to ${user.tag}`);
    } catch (err) {
      console.error('[ReactionRoles] Failed to add role:', err);
    }
  });
  
  // Handle reaction remove
  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;
    
    // Fetch partial reactions
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }
    
    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name;
    
    if (!emoji || !reactionRoles[messageId]) return;
    
    const roleId = reactionRoles[messageId][emoji];
    if (!roleId) return;
    
    try {
      const guild = reaction.message.guild;
      if (!guild) return;
      
      const member = await guild.members.fetch(user.id);
      await member.roles.remove(roleId);
      console.log(`[ReactionRoles] Removed role from ${user.tag}`);
    } catch (err) {
      console.error('[ReactionRoles] Failed to remove role:', err);
    }
  });
  
  console.log('[ReactionRoles] Reaction roles handler initialized');
}
