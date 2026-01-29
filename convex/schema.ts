import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  balances: defineTable({
    userId: v.string(),
    balance: v.number(),
  }).index("by_userId", ["userId"]),
});
