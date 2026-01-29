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
export declare const claimDaily: import("convex/server").RegisteredMutation<"public", {
    userId: string;
}, Promise<{
    success: boolean;
    cooldownRemaining: number;
    reward?: undefined;
    newBalance?: undefined;
} | {
    success: boolean;
    reward: number;
    newBalance: number;
    cooldownRemaining?: undefined;
}>>;
export declare const getLeaderboard: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
}, Promise<{
    rank: number;
    userId: string;
    balance: number;
}[]>>;
//# sourceMappingURL=economy.d.ts.map