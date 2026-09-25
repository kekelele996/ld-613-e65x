import { create } from "zustand";
import { listTimelineTrack } from "../api/TimelineTrack";
import { repointTrackController } from "../controllers/TimelineTrackController";
import type { TimelineTrack } from "../types/TimelineTrack";

type State = {
  rows: TimelineTrack[];
  loading: boolean;
  lastError: string | null;
  load: () => Promise<void>;
  repoint: (trackId: number, newSceneId: number) => Promise<TimelineTrack>;
};

export const useTimelineTrackStore = create<State>((set) => ({
  rows: [],
  loading: false,
  lastError: null,
  async load() {
    set({ loading: true, lastError: null });
    try {
      set({ rows: await listTimelineTrack(), loading: false });
    } catch (error) {
      set({ loading: false, lastError: error instanceof Error ? error.message : "轨道加载失败" });
    }
  },
  async repoint(trackId, newSceneId) {
    const updated = await repointTrackController(trackId, newSceneId);
    set((state) => ({ rows: state.rows.map((row) => (row.id === updated.id ? updated : row)) }));
    return updated;
  }
}));
