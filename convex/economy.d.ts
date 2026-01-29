export declare const getBalance: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<number>>;
export declare const setBalance: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    amount: number;
}, Promise<void>>;
export declare const addBalance: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    amount: number;
}, Promise<number>>;
export declare const subtractBalance: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    amount: number;
}, Promise<number>>;
//# sourceMappingURL=economy.d.ts.map