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
    dailyClaims: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        lastClaim: number;
    }, {
        userId: import("convex/values").VString<string, "required">;
        lastClaim: import("convex/values").VFloat64<number, "required">;
    }, "required", "userId" | "lastClaim">, {
        by_userId: ["userId", "_creationTime"];
    }, {}, {}>;
    userPrefixes: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        prefix: string;
    }, {
        userId: import("convex/values").VString<string, "required">;
        prefix: import("convex/values").VString<string, "required">;
    }, "required", "userId" | "prefix">, {
        by_userId: ["userId", "_creationTime"];
    }, {}, {}>;
    warnings: import("convex/server").TableDefinition<import("convex/values").VObject<{
        timestamp: number;
        oduserId: string;
        odmoderatorId: string;
        reason: string;
    }, {
        oduserId: import("convex/values").VString<string, "required">;
        odmoderatorId: import("convex/values").VString<string, "required">;
        reason: import("convex/values").VString<string, "required">;
        timestamp: import("convex/values").VFloat64<number, "required">;
    }, "required", "timestamp" | "oduserId" | "odmoderatorId" | "reason">, {
        by_oduserId: ["oduserId", "_creationTime"];
    }, {}, {}>;
    featureRequests: import("convex/server").TableDefinition<import("convex/values").VObject<{
        status?: string | undefined;
        username: string;
        userId: string;
        timestamp: number;
        request: string;
    }, {
        userId: import("convex/values").VString<string, "required">;
        username: import("convex/values").VString<string, "required">;
        request: import("convex/values").VString<string, "required">;
        timestamp: import("convex/values").VFloat64<number, "required">;
        status: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "username" | "status" | "userId" | "timestamp" | "request">, {
        by_timestamp: ["timestamp", "_creationTime"];
    }, {}, {}>;
    reminders: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        guildId: string;
        message: string;
        channelId: string;
        userId: string;
        fireAt: number;
        fired: boolean;
    }, {
        userId: import("convex/values").VString<string, "required">;
        channelId: import("convex/values").VString<string, "required">;
        guildId: import("convex/values").VString<string, "required">;
        message: import("convex/values").VString<string, "required">;
        fireAt: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        fired: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "createdAt" | "guildId" | "message" | "channelId" | "userId" | "fireAt" | "fired">, {
        by_userId: ["userId", "_creationTime"];
        by_fireAt: ["fireAt", "_creationTime"];
    }, {}, {}>;
    invites: import("convex/server").TableDefinition<import("convex/values").VObject<{
        inviteCode?: string | undefined;
        guildId: string;
        userId: string;
        timestamp: number;
        inviterId: string;
    }, {
        guildId: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        inviterId: import("convex/values").VString<string, "required">;
        inviteCode: import("convex/values").VString<string | undefined, "optional">;
        timestamp: import("convex/values").VFloat64<number, "required">;
    }, "required", "guildId" | "userId" | "timestamp" | "inviterId" | "inviteCode">, {
        by_guildId: ["guildId", "_creationTime"];
        by_inviterId: ["inviterId", "_creationTime"];
        by_guildId_inviterId: ["guildId", "inviterId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map