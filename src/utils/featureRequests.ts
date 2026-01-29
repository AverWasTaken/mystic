import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

export interface FeatureRequest {
  id: string;
  userId: string;
  username: string;
  request: string;
  timestamp: number;
  status: string;
}

export async function addFeatureRequest(
  userId: string,
  username: string,
  request: string
): Promise<{ id: string; timestamp: number }> {
  const result = await getClient().mutation(api.featureRequests.addRequest, {
    userId,
    username,
    request,
  });
  return { id: result.id as string, timestamp: result.timestamp };
}

export async function getAllFeatureRequests(): Promise<FeatureRequest[]> {
  const results = await getClient().query(api.featureRequests.getAllRequests, {});
  return results.map((r) => ({
    ...r,
    id: r.id as string,
  }));
}

export async function deleteFeatureRequest(id: string): Promise<{ deleted: boolean }> {
  return await getClient().mutation(api.featureRequests.deleteRequest, {
    id: id as Id<"featureRequests">,
  });
}

export async function updateRequestStatus(
  id: string,
  status: string
): Promise<{ updated: boolean }> {
  return await getClient().mutation(api.featureRequests.updateStatus, {
    id: id as Id<"featureRequests">,
    status,
  });
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
