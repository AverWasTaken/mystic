import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const DEFAULT_BALANCE = 1000;

// Lazy-initialize Convex client (dotenv may not have loaded yet at import time)
let _client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient {
  if (!_client) {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("CONVEX_URL environment variable is not set");
    }
    _client = new ConvexHttpClient(convexUrl);
  }
  return _client;
}

export async function getBalance(userId: string): Promise<number> {
  const balance = await getClient().query(api.economy.getBalance, { userId });
  return balance;
}

export async function setBalance(userId: string, amount: number): Promise<void> {
  await getClient().mutation(api.economy.setBalance, { userId, amount });
}

export async function addBalance(userId: string, amount: number): Promise<number> {
  return await getClient().mutation(api.economy.addBalance, { userId, amount });
}

export async function subtractBalance(userId: string, amount: number): Promise<number> {
  return await getClient().mutation(api.economy.subtractBalance, { userId, amount });
}

export async function hasEnough(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= amount;
}

export async function parseBetAmount(userId: string, input: string): Promise<number | null> {
  const balance = await getBalance(userId);
  
  if (input.toLowerCase() === 'all') {
    return balance > 0 ? balance : null;
  }
  
  const amount = parseInt(input, 10);
  if (isNaN(amount) || amount <= 0) {
    return null;
  }
  
  return amount;
}

export async function claimDaily(userId: string): Promise<{ success: boolean; reward?: number; newBalance?: number; cooldownRemaining?: number }> {
  return await getClient().mutation(api.economy.claimDaily, { userId });
}

export async function getLeaderboard(limit: number = 10): Promise<{ rank: number; userId: string; balance: number }[]> {
  return await getClient().query(api.economy.getLeaderboard, { limit });
}
