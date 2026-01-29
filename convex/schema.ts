import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  balances: defineTable({
    userId: v.string(),
    balance: v.number(),
  }).index("by_userId", ["userId"]),

  afk: defineTable({
    userId: v.string(),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_userId", ["userId"]),

  dailyClaims: defineTable({
    userId: v.string(),
    lastClaim: v.number(),
  }).index("by_userId", ["userId"]),
});
