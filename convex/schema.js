"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    balances: (0, server_1.defineTable)({
        userId: values_1.v.string(),
        balance: values_1.v.number(),
    }).index("by_userId", ["userId"]),
});
//# sourceMappingURL=schema.js.map