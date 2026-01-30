import { Client, Events, GatewayIntentBits } from 'discord.js';

// Reaction role mappings: messageId -> { emoji: roleId }
const reactionRoles: Record<string, Record<string, string>> = {
  // Editing Software
  '1466438782986354719': {
    'aftereffects': '1466099626846322823', // After Effects
    'alightmotion': '1466099663206875248', // Alight Motion
    'capcut': '1466099691442798766', // Capcut
    '4638videostar': '1466099711898292316', // Videostar
  },
  // Audio Pings
  '1466438792289190126': {
    '🖤': '1466107415970709768', // Aesthetic audio ping
    '⚡': '1466107468189798431', // Shake audio ping
    '🎬': '1466107497562505327', // Film audio ping
  },
  // Notification Pings
  '1466446264429449479': {
    'tiktok': '1466444788441284847', // TikTok Posts
    '💀': '1466444830145249290', // Dead Chat Ping
  },
  // Gender Roles
  '1466446268778680352': {
    '🔵': '1466444863439376657', // Male
    '🟣': '1466444921002131681', // Female
  },
  // Helper Role
  '1466773517998624779': {
    '⭐': '1465848010419343622', // Helper
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
