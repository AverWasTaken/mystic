export declare const addWarning: import("convex/server").RegisteredMutation<"public", {
    oduserId: string;
    odmoderatorId: string;
    reason: string;
}, Promise<number>>;
export declare const getWarnings: import("convex/server").RegisteredQuery<"public", {
    oduserId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"warnings">;
    _creationTime: number;
    timestamp: number;
    oduserId: string;
    odmoderatorId: string;
    reason: string;
}[]>>;
export declare const clearWarnings: import("convex/server").RegisteredMutation<"public", {
    oduserId: string;
}, Promise<number>>;
export declare const getWarningCount: import("convex/server").RegisteredQuery<"public", {
    oduserId: string;
}, Promise<number>>;
//# sourceMappingURL=warnings.d.ts.map