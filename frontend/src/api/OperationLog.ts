import { getAll, STORES } from "../db";
import type { OperationLog } from "../types/OperationLog";

const endpoint = "/api/operation-log";

export async function listOperationLog(): Promise<OperationLog[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  const rows = await getAll<OperationLog>(STORES.operationLog);
  return rows.sort((a, b) => b.id - a.id);
}
