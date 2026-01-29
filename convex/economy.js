"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.claimDaily = exports.subtractBalance = exports.addBalance = exports.setBalance = exports.getBalance = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
const DEFAULT_BALANCE = 1000;
exports.getBalance = (0, server_1.query)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("balances")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        return record?.balance ?? DEFAULT_BALANCE;
    },
});
exports.setBalance = (0, server_1.mutation)({
    args: { userId: values_1.v.string(), amount: values_1.v.number() },
    handler: async (ctx, args) => {
        const safeAmount = Math.max(0, Math.floor(args.amount));
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { balance: safeAmount });
        }
        else {
            await ctx.db.insert("balances", { userId: args.userId, balance: safeAmount });
        }
    },
});
exports.addBalance = (0, server_1.mutation)({
    args: { userId: values_1.v.string(), amount: values_1.v.number() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        const current = existing?.balance ?? DEFAULT_BALANCE;
        const newBalance = Math.max(0, Math.floor(current + args.amount));
        if (existing) {
            await ctx.db.patch(existing._id, { balance: newBalance });
        }
        else {
            await ctx.db.insert("balances", { userId: args.userId, balance: newBalance });
        }
        return newBalance;
    },
});
exports.subtractBalance = (0, server_1.mutation)({
    args: { userId: values_1.v.string(), amount: values_1.v.number() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        const current = existing?.balance ?? DEFAULT_BALANCE;
        const newBalance = Math.max(0, Math.floor(current - args.amount));
        if (existing) {
            await ctx.db.patch(existing._id, { balance: newBalance });
        }
        else {
            await ctx.db.insert("balances", { userId: args.userId, balance: newBalance });
        }
        return newBalance;
    },
});
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms
const DAILY_MIN = 100;
const DAILY_MAX = 500;
exports.claimDaily = (0, server_1.mutation)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, args) => {
        const now = Date.now();
        // Check last claim
        const claimRecord = await ctx.db
            .query("dailyClaims")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        if (claimRecord) {
            const timeSinceClaim = now - claimRecord.lastClaim;
            if (timeSinceClaim < DAILY_COOLDOWN) {
                const remaining = DAILY_COOLDOWN - timeSinceClaim;
                return { success: false, cooldownRemaining: remaining };
            }
        }
        // Generate random reward
        const reward = Math.floor(Math.random() * (DAILY_MAX - DAILY_MIN + 1)) + DAILY_MIN;
        // Update last claim time
        if (claimRecord) {
            await ctx.db.patch(claimRecord._id, { lastClaim: now });
        }
        else {
            await ctx.db.insert("dailyClaims", { userId: args.userId, lastClaim: now });
        }
        // Add balance
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        const current = existing?.balance ?? DEFAULT_BALANCE;
        const newBalance = current + reward;
        if (existing) {
            await ctx.db.patch(existing._id, { balance: newBalance });
        }
        else {
            await ctx.db.insert("balances", { userId: args.userId, balance: newBalance });
        }
        return { success: true, reward, newBalance };
    },
});
exports.getLeaderboard = (0, server_1.query)({
    args: { limit: values_1.v.optional(values_1.v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        // Get all balances and sort by balance descending
        const allBalances = await ctx.db.query("balances").collect();
        allBalances.sort((a, b) => b.balance - a.balance);
        return allBalances.slice(0, limit).map((record, index) => ({
            rank: index + 1,
            userId: record.userId,
            balance: record.balance,
        }));
    },
});
//# sourceMappingURL=economy.js.map