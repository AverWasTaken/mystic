"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReminders = exports.deleteReminder = exports.markFired = exports.getPendingReminders = exports.createReminder = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.createReminder = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        channelId: values_1.v.string(),
        guildId: values_1.v.string(),
        message: values_1.v.string(),
        fireAt: values_1.v.number(), // Unix timestamp when to fire
        createdAt: values_1.v.number(),
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
exports.getPendingReminders = (0, server_1.query)({
    args: { before: values_1.v.number() },
    handler: async (ctx, args) => {
        const reminders = await ctx.db
            .query("reminders")
            .withIndex("by_fireAt")
            .filter((q) => q.and(q.lte(q.field("fireAt"), args.before), q.eq(q.field("fired"), false)))
            .collect();
        return reminders;
    },
});
exports.markFired = (0, server_1.mutation)({
    args: { id: values_1.v.id("reminders") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { fired: true });
    },
});
exports.deleteReminder = (0, server_1.mutation)({
    args: { id: values_1.v.id("reminders") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
exports.getUserReminders = (0, server_1.query)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, args) => {
        const reminders = await ctx.db
            .query("reminders")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("fired"), false))
            .collect();
        return reminders;
    },
});
//# sourceMappingURL=reminders.js.map