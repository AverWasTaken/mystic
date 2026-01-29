"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePrefix = exports.setPrefix = exports.getAllPrefixes = exports.getPrefix = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getPrefix = (0, server_1.query)({
    args: { userId: values_1.v.string() },
    handler: async (ctx, { userId }) => {
        const record = await ctx.db
            .query("userPrefixes")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();
        return record?.prefix ?? null;
    },
});
exports.getAllPrefixes = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        const records = await ctx.db.query("userPrefixes").collect();
        const prefixMap = {};
        for (const record of records) {
            prefixMap[record.userId] = record.prefix;
        }
        return prefixMap;
    },
});
exports.setPrefix = (0, server_1.mutation)({
    args: { userId: values_1.v.string(), prefix: values_1.v.string() },
    handler: async (ctx, { userId, prefix }) => {
        const existing = await ctx.db
            .query("userPrefixes")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { prefix });
        }
        else {
            await ctx.db.insert("userPrefixes", { userId, prefix });
        }
        return { userId, prefix };
    },
});
exports.removePrefix = (0, server_1.mutation)({
    args: { userId: values_1.v.string() },
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
//# sourceMappingURL=prefixes.js.map