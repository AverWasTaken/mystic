import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPrefix = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const record = await ctx.db
      .query("userPrefixes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return record?.prefix ?? null;
  },
});

export const getAllPrefixes = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("userPrefixes").collect();
    const prefixMap: Record<string, string> = {};
    for (const record of records) {
      prefixMap[record.userId] = record.prefix;
    }
    return prefixMap;
  },
});

export const setPrefix = mutation({
  args: { userId: v.string(), prefix: v.string() },
  handler: async (ctx, { userId, prefix }) => {
    const existing = await ctx.db
      .query("userPrefixes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { prefix });
    } else {
      await ctx.db.insert("userPrefixes", { userId, prefix });
    }

    return { userId, prefix };
  },
});

export const removePrefix = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("userPrefixes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { removed: true };
    }

    return { removed: false };
  },
});
