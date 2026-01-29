import { Client, EmbedBuilder, Message, GuildMember, PartialMessage, TextChannel } from 'discord.js';

// Change this to your logging channel ID
export const LOG_CHANNEL_ID = '1466338916062724150';

// Colors
const COLORS = {
  EDIT: 0xF1C40F,    // Yellow
  DELETE: 0xE74C3C,  // Red
  JOIN: 0x2ECC71,    // Green
  LEAVE: 0xE67E22    // Orange
};

async function getLogChannel(client: Client): Promise<TextChannel | null> {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (channel?.isTextBased() && 'send' in channel) {
      return channel as TextChannel;
    }
    return null;
  } catch (err) {
    console.error('[LOGS] Failed to fetch log channel:', err);
    return null;
  }
}

export async function logMessageEdit(
  client: Client,
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): Promise<void> {
  const logChannel = await getLogChannel(client);
  if (!logChannel) return;

  // Skip if content didn't change (e.g., embed updates)
  if (oldMessage.content === newMessage.content) return;

  const oldContent = oldMessage.content || '*[Content unavailable - message was not cached]*';
  const newContent = newMessage.content || '*[Content unavailable]*';

  const embed = new EmbedBuilder()
    .setColor(COLORS.EDIT)
    .setTitle('✏️ Message Edited')
    .setAuthor({
      name: newMessage.author?.tag || 'Unknown User',
      iconURL: newMessage.author?.displayAvatarURL() || undefined
    })
    .addFields(
      { name: 'Before', value: oldContent.slice(0, 1024) || '*Empty*' },
      { name: 'After', value: newContent.slice(0, 1024) || '*Empty*' },
      { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
      { name: 'Author', value: newMessage.author ? `<@${newMessage.author.id}>` : 'Unknown', inline: true }
    )
    .setFooter({ text: `Message ID: ${newMessage.id}` })
    .setTimestamp();

  // Add jump link if available
  if (newMessage.url) {
    embed.addFields({ name: 'Jump to Message', value: `[Click here](${newMessage.url})`, inline: true });
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOGS] Failed to send edit log:', err);
  }
}

export async function logMessageDelete(
  client: Client,
  message: Message | PartialMessage
): Promise<void> {
  const logChannel = await getLogChannel(client);
  if (!logChannel) return;

  const content = message.content || '*[Content unavailable - message was not cached]*';

  const embed = new EmbedBuilder()
    .setColor(COLORS.DELETE)
    .setTitle('🗑️ Message Deleted')
    .setAuthor({
      name: message.author?.tag || 'Unknown User',
      iconURL: message.author?.displayAvatarURL() || undefined
    })
    .addFields(
      { name: 'Content', value: content.slice(0, 1024) || '*Empty*' },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
      { name: 'Author', value: message.author ? `<@${message.author.id}>` : 'Unknown', inline: true }
    )
    .setFooter({ text: `Message ID: ${message.id}` })
    .setTimestamp();

  // Add attachment info if any
  if (message.attachments && message.attachments.size > 0) {
    const attachmentList = message.attachments.map(a => a.name || a.url).join('\n');
    embed.addFields({ name: 'Attachments', value: attachmentList.slice(0, 1024) });
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOGS] Failed to send delete log:', err);
  }
}

export async function logMemberJoin(client: Client, member: GuildMember): Promise<void> {
  const logChannel = await getLogChannel(client);
  if (!logChannel) return;

  // Calculate account age
  const createdAt = member.user.createdAt;
  const now = new Date();
  const ageMs = now.getTime() - createdAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  
  let accountAge: string;
  if (ageDays < 1) {
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    accountAge = `${ageHours} hours`;
  } else if (ageDays < 30) {
    accountAge = `${ageDays} days`;
  } else if (ageDays < 365) {
    const months = Math.floor(ageDays / 30);
    accountAge = `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.floor(ageDays / 365);
    const remainingMonths = Math.floor((ageDays % 365) / 30);
    accountAge = `${years} year${years === 1 ? '' : 's'}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : ''}`;
  }

  // Warn if account is new (less than 7 days)
  const isNewAccount = ageDays < 7;

  const embed = new EmbedBuilder()
    .setColor(COLORS.JOIN)
    .setTitle('👋 Member Joined')
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL()
    })
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'User', value: `<@${member.id}>`, inline: true },
      { name: 'Account Age', value: isNewAccount ? `⚠️ ${accountAge} (New Account!)` : accountAge, inline: true },
      { name: 'Created', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`, inline: false },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOGS] Failed to send join log:', err);
  }
}

export async function logMemberLeave(client: Client, member: GuildMember): Promise<void> {
  const logChannel = await getLogChannel(client);
  if (!logChannel) return;

  // Calculate how long they were in the server
  const joinedAt = member.joinedAt;
  let membershipDuration = 'Unknown';
  
  if (joinedAt) {
    const now = new Date();
    const durationMs = now.getTime() - joinedAt.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    
    if (durationDays < 1) {
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      membershipDuration = `${durationHours} hours`;
    } else if (durationDays < 30) {
      membershipDuration = `${durationDays} days`;
    } else if (durationDays < 365) {
      const months = Math.floor(durationDays / 30);
      membershipDuration = `${months} month${months === 1 ? '' : 's'}`;
    } else {
      const years = Math.floor(durationDays / 365);
      membershipDuration = `${years} year${years === 1 ? '' : 's'}`;
    }
  }

  // Get roles (excluding @everyone)
  const roles = member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .map(r => r.name)
    .join(', ') || 'None';

  const embed = new EmbedBuilder()
    .setColor(COLORS.LEAVE)
    .setTitle('👋 Member Left')
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL()
    })
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'User', value: `<@${member.id}>`, inline: true },
      { name: 'Time in Server', value: membershipDuration, inline: true },
      { name: 'Roles', value: roles.slice(0, 1024), inline: false },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (joinedAt) {
    embed.addFields({ name: 'Joined', value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:F>`, inline: false });
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOGS] Failed to send leave log:', err);
  }
}
