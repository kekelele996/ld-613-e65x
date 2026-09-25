import { getAll, putRow, STORES } from "../db";
import type { Fixture } from "../types/Fixture";

const endpoint = "/api/fixture";

export async function listFixture(): Promise<Fixture[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return getAll<Fixture>(STORES.fixture);
}

export async function saveFixture(payload: Fixture): Promise<Fixture> {
  return putRow(STORES.fixture, payload);
}
