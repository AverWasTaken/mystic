"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvitesForUser = exports.getTopInviters = exports.getInviteCount = exports.recordInvite = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.recordInvite = (0, server_1.mutation)({
    args: {
        guildId: values_1.v.string(),
        userId: values_1.v.string(),
        inviterId: values_1.v.string(),
        inviteCode: values_1.v.optional(values_1.v.string()),
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
            .withIndex("by_guildId_inviterId", (q) => q.eq("guildId", args.guildId).eq("inviterId", args.inviterId))
            .collect();
        return invites.length;
    },
});
exports.getInviteCount = (0, server_1.query)({
    args: {
        guildId: values_1.v.string(),
        inviterId: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const invites = await ctx.db
            .query("invites")
            .withIndex("by_guildId_inviterId", (q) => q.eq("guildId", args.guildId).eq("inviterId", args.inviterId))
            .collect();
        return invites.length;
    },
});
exports.getTopInviters = (0, server_1.query)({
    args: {
        guildId: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        // Get all invites for this guild
        const allInvites = await ctx.db
            .query("invites")
            .withIndex("by_guildId", (q) => q.eq("guildId", args.guildId))
            .collect();
        // Count invites per inviter
        const inviteCounts = {};
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
exports.getInvitesForUser = (0, server_1.query)({
    args: {
        guildId: values_1.v.string(),
        inviterId: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const invites = await ctx.db
            .query("invites")
            .withIndex("by_guildId_inviterId", (q) => q.eq("guildId", args.guildId).eq("inviterId", args.inviterId))
            .collect();
        return invites.sort((a, b) => b.timestamp - a.timestamp);
    },
});
//# sourceMappingURL=invites.js.map