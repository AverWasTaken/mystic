"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarningCount = exports.clearWarnings = exports.getWarnings = exports.addWarning = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.addWarning = (0, server_1.mutation)({
    args: {
        oduserId: values_1.v.string(),
        odmoderatorId: values_1.v.string(),
        reason: values_1.v.string(),
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
exports.getWarnings = (0, server_1.query)({
    args: { oduserId: values_1.v.string() },
    handler: async (ctx, args) => {
        const warnings = await ctx.db
            .query("warnings")
            .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
            .collect();
        return warnings.sort((a, b) => b.timestamp - a.timestamp);
    },
});
exports.clearWarnings = (0, server_1.mutation)({
    args: { oduserId: values_1.v.string() },
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
exports.getWarningCount = (0, server_1.query)({
    args: { oduserId: values_1.v.string() },
    handler: async (ctx, args) => {
        const warnings = await ctx.db
            .query("warnings")
            .withIndex("by_oduserId", (q) => q.eq("oduserId", args.oduserId))
            .collect();
        return warnings.length;
    },
});
//# sourceMappingURL=warnings.js.map