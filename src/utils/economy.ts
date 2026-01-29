import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// Use project root for data directory (works from both src and dist)
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'economy.db');
const DEFAULT_BALANCE = 1000;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS balances (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT ${DEFAULT_BALANCE}
  )
`);

// Prepare statements for better performance
const getBalanceStmt = db.prepare('SELECT balance FROM balances WHERE user_id = ?');
const insertBalanceStmt = db.prepare('INSERT INTO balances (user_id, balance) VALUES (?, ?)');
const updateBalanceStmt = db.prepare('UPDATE balances SET balance = ? WHERE user_id = ?');

export function getBalance(userId: string): number {
  const row = getBalanceStmt.get(userId) as { balance: number } | undefined;
  
  if (row === undefined) {
    insertBalanceStmt.run(userId, DEFAULT_BALANCE);
    return DEFAULT_BALANCE;
  }
  
  return row.balance;
}

export function setBalance(userId: string, amount: number): void {
  const safeAmount = Math.max(0, Math.floor(amount));
  const row = getBalanceStmt.get(userId);
  
  if (row === undefined) {
    insertBalanceStmt.run(userId, safeAmount);
  } else {
    updateBalanceStmt.run(safeAmount, userId);
  }
}

export function addBalance(userId: string, amount: number): number {
  const current = getBalance(userId);
  const newBalance = current + amount;
  setBalance(userId, newBalance);
  return Math.max(0, Math.floor(newBalance));
}

export function subtractBalance(userId: string, amount: number): number {
  const current = getBalance(userId);
  const newBalance = current - amount;
  setBalance(userId, newBalance);
  return Math.max(0, Math.floor(newBalance));
}

export function hasEnough(userId: string, amount: number): boolean {
  return getBalance(userId) >= amount;
}

export function parseBetAmount(userId: string, input: string): number | null {
  const balance = getBalance(userId);
  
  if (input.toLowerCase() === 'all') {
    return balance > 0 ? balance : null;
  }
  
  const amount = parseInt(input, 10);
  if (isNaN(amount) || amount <= 0) {
    return null;
  }
  
  return amount;
}
