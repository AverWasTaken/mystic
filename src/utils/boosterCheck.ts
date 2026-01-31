import { GuildMember } from 'discord.js';

/**
 * Check if a guild member is a server booster
 * @param member The guild member to check
 * @returns true if the member is currently boosting the server
 */
export function isBooster(member: GuildMember | null | undefined): boolean {
  if (!member) return false;
  return member.premiumSince !== null;
}

/**
 * Booster multiplier for gambling winnings (1.2x = 20% bonus)
 */
export const BOOSTER_GAMBLING_MULTIPLIER = 1.2;

/**
 * Booster multiplier for daily rewards (2x = double)
 */
export const BOOSTER_DAILY_MULTIPLIER = 2;
