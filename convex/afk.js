"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAfk = exports.setAfk = exports.getAfkByIds = exports.getAfk = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getAfk = (0, server_1.query)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("afk")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        return record ?? null;
    },
});
exports.getAfkByIds = (0, server_1.query)({
    args: { userIds: values_1.v.array(values_1.v.string()) },
    handler: async (ctx, args) => {
        const results = {};
        for (const userId of args.userIds) {
            const record = await ctx.db
                .query("afk")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .unique();
            results[userId] = record ? { message: record.message, timestamp: record.timestamp } : null;
        }
        return results;
    },
});
exports.setAfk = (0, server_1.mutation)({
    args: { userId: values_1.v.string(), message: values_1.v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("afk")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        const timestamp = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, { message: args.message, timestamp });
        }
        else {
            await ctx.db.insert("afk", { userId: args.userId, message: args.message, timestamp });
        }
        return { userId: args.userId, message: args.message, timestamp };
    },
});
exports.removeAfk = (0, server_1.mutation)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("afk")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        if (existing) {
            const duration = Date.now() - existing.timestamp;
            await ctx.db.delete(existing._id);
            return { removed: true, duration };
        }
        return { removed: false, duration: 0 };
    },
});
//# sourceMappingURL=afk.js.map