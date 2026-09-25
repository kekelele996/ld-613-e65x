import { getAll, putRow, STORES } from "../db";
import type { ShowProject } from "../types/ShowProject";

const endpoint = "/api/show-project";

export async function listShowProject(): Promise<ShowProject[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
 return getAll<ShowProject>(STORES.showProject);
}

export async function saveShowProject(payload: ShowProject): Promise<ShowProject> {
  return putRow(STORES.showProject, payload);
}
