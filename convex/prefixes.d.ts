export declare const getPrefix: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<string | null>>;
export declare const getAllPrefixes: import("convex/server").RegisteredQuery<"public", {}, Promise<Record<string, string>>>;
export declare const setPrefix: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    prefix: string;
}, Promise<{
    userId: string;
    prefix: string;
}>>;
export declare const removePrefix: import("convex/server").RegisteredMutation<"public", {
    userId: string;
}, Promise<{
    removed: boolean;
}>>;
//# sourceMappingURL=prefixes.d.ts.map