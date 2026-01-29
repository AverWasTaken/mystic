import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addWarning = mutation({
  args: {
    oduserId: v.string(),
    odmoderatorId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("warnings", {
      oduserId: args.oduserId,
      odmoderatorId: args.odmoderatorId,
      reason: args.reason,
      timestamp,
    });

    // Return the new warning count
    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
      .collect();

    return warnings.length;
  },
});

export const getWarnings = query({
  args: { oduserId: v.string() },
  handler: async (ctx, args) => {
    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
      .collect();

    return warnings.sort((a, b) => b.timestamp - a.timestamp);
  },
});

export const clearWarnings = mutation({
  args: { oduserId: v.string() },
  handler: async (ctx, args) => {
    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
      .collect();

    for (const warning of warnings) {
      await ctx.db.delete(warning._id);
    }

    return warnings.length;
  },
});

export const getWarningCount = query({
  args: { oduserId: v.string() },
  handler: async (ctx, args) => {
    const warnings = await ctx.db
      .query("warnings")
      .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
      .collect();

    return warnings.length;
  },
});
