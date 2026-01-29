import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_BALANCE = 1000;

export const getBalance = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("balances")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    return record?.balance ?? DEFAULT_BALANCE;
  },
});

export const setBalance = mutation({
  args: { userId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const safeAmount = Math.max(0, Math.floor(args.amount));
    
    const existing = await ctx.db
      .query("balances")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, { balance: safeAmount });
    } else {
      await ctx.db.insert("balances", { userId: args.userId, balance: safeAmount });
    }
  },
});

export const addBalance = mutation({
  args: { userId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("balances")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    const current = existing?.balance ?? DEFAULT_BALANCE;
    const newBalance = Math.max(0, Math.floor(current + args.amount));
    
    if (existing) {
      await ctx.db.patch(existing._id, { balance: newBalance });
    } else {
      await ctx.db.insert("balances", { userId: args.userId, balance: newBalance });
    }
    
    return newBalance;
  },
});

export const subtractBalance = mutation({
  args: { userId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("balances")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    const current = existing?.balance ?? DEFAULT_BALANCE;
    const newBalance = Math.max(0, Math.floor(current - args.amount));
    
    if (existing) {
      await ctx.db.patch(existing._id, { balance: newBalance });
    } else {
      await ctx.db.insert("balances", { userId: args.userId, balance: newBalance });
    }
    
    return newBalance;
  },
});
