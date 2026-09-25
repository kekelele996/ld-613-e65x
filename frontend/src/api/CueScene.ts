import { getAll, putRow, deleteRow, STORES } from "../db";
import type { CueScene } from "../types/CueScene";

const endpoint = "/api/cue-scene";

export async function listCueScene(): Promise<CueScene[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return getAll<CueScene>(STORES.cueScene);
}

export async function saveCueScene(payload: CueScene): Promise<CueScene> {
  return putRow(STORES.cueScene, payload);
}

export async function removeCueScene(id: number): Promise<void> {
  return deleteRow(STORES.cueScene, id);
}
