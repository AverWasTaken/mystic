export declare const getAfk: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"afk">;
    _creationTime: number;
    message: string;
    userId: string;
    timestamp: number;
} | null>>;
export declare const getAfkByIds: import("convex/server").RegisteredQuery<"public", {
    userIds: string[];
}, Promise<Record<string, {
    message: string;
    timestamp: number;
} | null>>>;
export declare const setAfk: import("convex/server").RegisteredMutation<"public", {
    message: string;
    userId: string;
}, Promise<{
    userId: string;
    message: string;
    timestamp: number;
}>>;
export declare const removeAfk: import("convex/server").RegisteredMutation<"public", {
    userId: string;
}, Promise<{
    removed: boolean;
    duration: number;
}>>;
export declare const getAllAfk: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    userId: string;
    message: string;
    timestamp: number;
}[]>>;
//# sourceMappingURL=afk.d.ts.map