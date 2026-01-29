declare const _default: import("convex/server").SchemaDefinition<{
    balances: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        balance: number;
    }, {
        userId: import("convex/values").VString<string, "required">;
        balance: import("convex/values").VFloat64<number, "required">;
    }, "required", "userId" | "balance">, {
        by_userId: ["userId", "_creationTime"];
    }, {}, {}>;
    afk: import("convex/server").TableDefinition<import("convex/values").VObject<{
        message: string;
        userId: string;
        timestamp: number;
    }, {
        userId: import("convex/values").VString<string, "required">;
        message: import("convex/values").VString<string, "required">;
        timestamp: import("convex/values").VFloat64<number, "required">;
    }, "required", "message" | "userId" | "timestamp">, {
        by_userId: ["userId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map