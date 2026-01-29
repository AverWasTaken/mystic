import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addRequest = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    request: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const id = await ctx.db.insert("featureRequests", {
      userId: args.userId,
      username: args.username,
      request: args.request,
      timestamp,
      status: "pending",
    });
    
    return { id, timestamp };
  },
});

export const getAllRequests = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query("featureRequests")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    
    return records.map((r) => ({
      id: r._id,
      userId: r.userId,
      username: r.username,
      request: r.request,
      timestamp: r.timestamp,
      status: r.status ?? "pending",
    }));
  },
});

export const deleteRequest = mutation({
  args: { id: v.id("featureRequests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("featureRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return { updated: true };
  },
});
