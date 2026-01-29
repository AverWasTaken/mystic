"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.deleteRequest = exports.getAllRequests = exports.addRequest = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.addRequest = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        username: values_1.v.string(),
        request: values_1.v.string(),
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
exports.getAllRequests = (0, server_1.query)({
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
exports.deleteRequest = (0, server_1.mutation)({
    args: { id: values_1.v.id("featureRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return { deleted: true };
    },
});
exports.updateStatus = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("featureRequests"),
        status: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
        return { updated: true };
    },
});
//# sourceMappingURL=featureRequests.js.map