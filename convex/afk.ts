import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAfk = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("afk")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    return record ?? null;
  },
});

export const getAfkByIds = query({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results: Record<string, { message: string; timestamp: number } | null> = {};
    
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

export const setAfk = mutation({
  args: { userId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("afk")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    const timestamp = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, { message: args.message, timestamp });
    } else {
      await ctx.db.insert("afk", { userId: args.userId, message: args.message, timestamp });
    }
    
    return { userId: args.userId, message: args.message, timestamp };
  },
});

export const removeAfk = mutation({
  args: { userId: v.string() },
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

export const getAllAfk = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("afk").collect();
    return records.map((r) => ({
      userId: r.userId,
      message: r.message,
      timestamp: r.timestamp,
    }));
  },
});
