import { create } from "zustand";
import {
  listTimelineTrack,
  repointTimelineTracks,
  saveTimelineTrack,
  toggleTimelineTrackLock
} from "../api/TimelineTrack";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { CueScene } from "../types/CueScene";

type State = {
  rows: TimelineTrack[];
  loading: boolean;
  load: () => Promise<void>;
  save: (payload: TimelineTrack) => Promise<TimelineTrack>;
  toggleLock: (payload: TimelineTrack) => Promise<TimelineTrack>;
  /** 轨道改用新场景。 */
  repoint: (
    fromSceneId: number,
    toSceneId: number,
    scenes?: CueScene[],
    trackIds?: number[]
  ) => Promise<TimelineTrack[]>;
};

export const useTimelineTrackStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    try {
      set({ rows: await listTimelineTrack(), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async save(payload) {
    const saved = await saveTimelineTrack(payload);
    set({
      rows: get()
        .rows.filter((row) => row.id !== saved.id)
        .concat(saved)
        .sort((a, b) => a.start_ms - b.start_ms || a.layer - b.layer)
    });
    return saved;
  },
  async toggleLock(payload) {
    const updated = await toggleTimelineTrackLock(payload);
    set({
      rows: get().rows.map((row) => (row.id === updated.id ? updated : row))
    });
    return updated;
  },
  async repoint(fromSceneId, toSceneId, scenes, trackIds) {
    const rows = await repointTimelineTracks(
      fromSceneId,
      toSceneId,
      scenes,
      trackIds
    );
    set({ rows });
    return rows;
  }
}));
