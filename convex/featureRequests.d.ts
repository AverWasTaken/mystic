export declare const addRequest: import("convex/server").RegisteredMutation<"public", {
    username: string;
    userId: string;
    request: string;
}, Promise<{
    id: import("convex/values").GenericId<"featureRequests">;
    timestamp: number;
}>>;
export declare const getAllRequests: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    id: import("convex/values").GenericId<"featureRequests">;
    userId: string;
    username: string;
    request: string;
    timestamp: number;
    status: string;
}[]>>;
export declare const deleteRequest: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"featureRequests">;
}, Promise<{
    deleted: boolean;
}>>;
export declare const updateStatus: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"featureRequests">;
    status: string;
}, Promise<{
    updated: boolean;
}>>;
//# sourceMappingURL=featureRequests.d.ts.map