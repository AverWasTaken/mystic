"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtractBalance = exports.addBalance = exports.setBalance = exports.getBalance = void 0;
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
//# sourceMappingURL=economy.js.map