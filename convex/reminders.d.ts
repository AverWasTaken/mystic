export declare const createReminder: import("convex/server").RegisteredMutation<"public", {
    createdAt: number;
    guildId: string;
    message: string;
    channelId: string;
    userId: string;
    fireAt: number;
}, Promise<import("convex/values").GenericId<"reminders">>>;
export declare const getPendingReminders: import("convex/server").RegisteredQuery<"public", {
    before: number;
}, Promise<{
    _id: import("convex/values").GenericId<"reminders">;
    _creationTime: number;
    createdAt: number;
    guildId: string;
    message: string;
    channelId: string;
    userId: string;
    fireAt: number;
    fired: boolean;
}[]>>;
export declare const markFired: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"reminders">;
}, Promise<void>>;
export declare const deleteReminder: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"reminders">;
}, Promise<void>>;
export declare const getUserReminders: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"reminders">;
    _creationTime: number;
    createdAt: number;
    guildId: string;
    message: string;
    channelId: string;
    userId: string;
    fireAt: number;
    fired: boolean;
}[]>>;
//# sourceMappingURL=reminders.d.ts.map