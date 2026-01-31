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

  userPrefixes: defineTable({
    userId: v.string(),
    prefix: v.string(),
  }).index("by_userId", ["userId"]),

  warnings: defineTable({
    oduserId: v.string(),
    odmoderatorId: v.string(),
    reason: v.string(),
    timestamp: v.number(),
  }).index("by_oduserId", ["oduserId"]),

  featureRequests: defineTable({
    userId: v.string(),
    username: v.string(),
    request: v.string(),
    timestamp: v.number(),
    status: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]),

  reminders: defineTable({
    userId: v.string(),
    channelId: v.string(),
    guildId: v.string(),
    message: v.string(),
    fireAt: v.number(),
    createdAt: v.number(),
    fired: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_fireAt", ["fireAt"]),

  invites: defineTable({
    guildId: v.string(),
    userId: v.string(),
    inviterId: v.string(),
    inviteCode: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_guildId", ["guildId"])
    .index("by_inviterId", ["inviterId"])
    .index("by_guildId_inviterId", ["guildId", "inviterId"]),
});
