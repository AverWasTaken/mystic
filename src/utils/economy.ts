import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.join(__dirname, '../data/economy.json');
const DEFAULT_BALANCE = 1000;

interface EconomyData {
  [userId: string]: number;
}

function loadData(): EconomyData {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, '{}');
      return {};
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveData(data: EconomyData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getBalance(userId: string): number {
  const data = loadData();
  if (data[userId] === undefined) {
    data[userId] = DEFAULT_BALANCE;
    saveData(data);
  }
  return data[userId];
}

export function setBalance(userId: string, amount: number): void {
  const data = loadData();
  data[userId] = Math.max(0, Math.floor(amount));
  saveData(data);
}

export function addBalance(userId: string, amount: number): number {
  const current = getBalance(userId);
  const newBalance = current + amount;
  setBalance(userId, newBalance);
  return newBalance;
}

export function subtractBalance(userId: string, amount: number): number {
  const current = getBalance(userId);
  const newBalance = current - amount;
  setBalance(userId, newBalance);
  return newBalance;
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
