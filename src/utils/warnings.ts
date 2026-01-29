import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Lazy-initialize Convex client
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

export interface Warning {
  _id: string;
  oduserId: string;
  odmoderatorId: string;
  reason: string;
  timestamp: number;
}

export async function addWarning(
  oduserId: string,
  odmoderatorId: string,
  reason: string
): Promise<number> {
  return await getClient().mutation(api.warnings.addWarning, {
    oduserId,
    odmoderatorId,
    reason,
  });
}

export async function getWarnings(oduserId: string): Promise<Warning[]> {
  return await getClient().query(api.warnings.getWarnings, { oduserId });
}

export async function clearWarnings(oduserId: string): Promise<number> {
  return await getClient().mutation(api.warnings.clearWarnings, { oduserId });
}

export async function getWarningCount(oduserId: string): Promise<number> {
  return await getClient().query(api.warnings.getWarningCount, { oduserId });
}
