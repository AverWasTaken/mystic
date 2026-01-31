import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordInvite = mutation({
  args: {
    guildId: v.string(),
    userId: v.string(),
    inviterId: v.string(),
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("invites", {
      guildId: args.guildId,
      userId: args.userId,
      inviterId: args.inviterId,
      inviteCode: args.inviteCode,
      timestamp,
    });

    // Return the inviter's new invite count for this guild
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_guildId_inviterId", (q) =>
        q.eq("guildId", args.guildId).eq("inviterId", args.inviterId)
      )
      .collect();

    return invites.length;
  },
});

export const getInviteCount = query({
  args: {
    guildId: v.string(),
    inviterId: v.string(),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_guildId_inviterId", (q) =>
        q.eq("guildId", args.guildId).eq("inviterId", args.inviterId)
      )
      .collect();

    return invites.length;
  },
});

export const getTopInviters = query({
  args: {
    guildId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all invites for this guild
    const allInvites = await ctx.db
      .query("invites")
      .withIndex("by_guildId", (q) => q.eq("guildId", args.guildId))
      .collect();

    // Count invites per inviter
    const inviteCounts: Record<string, number> = {};
    for (const invite of allInvites) {
      inviteCounts[invite.inviterId] = (inviteCounts[invite.inviterId] || 0) + 1;
    }

    // Sort by count descending and take top N
    const sorted = Object.entries(inviteCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([inviterId, count]) => ({ inviterId, count }));

    return sorted;
  },
});

export const getInvitesForUser = query({
  args: {
    guildId: v.string(),
    inviterId: v.string(),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_guildId_inviterId", (q) =>
        q.eq("guildId", args.guildId).eq("inviterId", args.inviterId)
      )
      .collect();

    return invites.sort((a, b) => b.timestamp - a.timestamp);
  },
});
