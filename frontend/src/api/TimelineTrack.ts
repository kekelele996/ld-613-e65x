import { getAll, putRow, STORES } from "../db";
import type { TimelineTrack } from "../types/TimelineTrack";

const endpoint = "/api/timeline-track";

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return getAll<TimelineTrack>(STORES.timelineTrack);
}

export async function saveTimelineTrack(payload: TimelineTrack): Promise<TimelineTrack> {
  return putRow(STORES.timelineTrack, payload);
}
