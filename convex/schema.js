"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    balances: (0, server_1.defineTable)({
        userId: values_1.v.string(),
        balance: values_1.v.number(),
    }).index("by_userId", ["userId"]),
    afk: (0, server_1.defineTable)({
        userId: values_1.v.string(),
        message: values_1.v.string(),
        timestamp: values_1.v.number(),
    }).index("by_userId", ["userId"]),
    dailyClaims: (0, server_1.defineTable)({
        userId: values_1.v.string(),
        lastClaim: values_1.v.number(),
    }).index("by_userId", ["userId"]),
    warnings: (0, server_1.defineTable)({
        oduserId: values_1.v.string(),
        odmoderatorId: values_1.v.string(),
        reason: values_1.v.string(),
        timestamp: values_1.v.number(),
    }).index("by_oduserId", ["oduserId"]),
    userPrefixes: (0, server_1.defineTable)({
        userId: values_1.v.string(),
        prefix: values_1.v.string(),
    }).index("by_userId", ["userId"]),
});
//# sourceMappingURL=schema.js.map