export declare const recordInvite: import("convex/server").RegisteredMutation<"public", {
    inviteCode?: string | undefined;
    guildId: string;
    userId: string;
    inviterId: string;
}, Promise<number>>;
export declare const getInviteCount: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    inviterId: string;
}, Promise<number>>;
export declare const getTopInviters: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
    guildId: string;
}, Promise<{
    inviterId: string;
    count: number;
}[]>>;
export declare const getInvitesForUser: import("convex/server").RegisteredQuery<"public", {
    guildId: string;
    inviterId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"invites">;
    _creationTime: number;
    inviteCode?: string | undefined;
    guildId: string;
    userId: string;
    timestamp: number;
    inviterId: string;
}[]>>;
//# sourceMappingURL=invites.d.ts.map