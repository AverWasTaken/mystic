import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createReminder = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    guildId: v.string(),
    message: v.string(),
    fireAt: v.number(), // Unix timestamp when to fire
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reminders", {
      userId: args.userId,
      channelId: args.channelId,
      guildId: args.guildId,
      message: args.message,
      fireAt: args.fireAt,
      createdAt: args.createdAt,
      fired: false,
    });
    return id;
  },
});

export const getPendingReminders = query({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_fireAt")
      .filter((q) => 
        q.and(
          q.lte(q.field("fireAt"), args.before),
          q.eq(q.field("fired"), false)
        )
      )
      .collect();
    return reminders;
  },
});

export const markFired = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { fired: true });
  },
});

export const deleteReminder = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getUserReminders = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fired"), false))
      .collect();
    return reminders;
  },
});
