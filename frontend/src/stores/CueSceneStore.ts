import { create } from "zustand";
import { listCueScene } from "../api/CueScene";
import {
  archiveSceneController,
  deriveSceneDraftController,
  persistSceneDraftController
} from "../controllers/CueSceneController";
import type { CueScene, CueSceneDraft } from "../types/CueScene";

type State = {
  rows: CueScene[];
  loading: boolean;
  lastError: string | null;
  load: () => Promise<void>;
  deriveDraft: (sourceId: number) => Promise<CueSceneDraft>;
  saveDraft: (draft: CueSceneDraft) => Promise<CueScene>;
  archive: (sceneId: number) => Promise<CueScene>;
};

export const useCueSceneStore = create<State>((set) => ({
  rows: [],
  loading: false,
  lastError: null,
  async load() {
    set({ loading: true, lastError: null });
    try {
      set({ rows: await listCueScene(), loading: false });
    } catch (error) {
      set({ loading: false, lastError: error instanceof Error ? error.message : "场景加载失败" });
    }
  },
  async deriveDraft(sourceId) {
    const draft = await deriveSceneDraftController(sourceId);
    return draft;
  },
  async saveDraft(draft) {
    const saved = await persistSceneDraftController(draft);
    set((state) => {
      const exists = state.rows.some((row) => row.id === saved.id);
      const rows = exists
        ? state.rows.map((row) => (row.id === saved.id ? saved : row))
        : [...state.rows, saved];
      return { rows };
    });
    return saved;
  },
  async archive(sceneId) {
    const archived = await archiveSceneController(sceneId);
    set((state) => ({ rows: state.rows.map((row) => (row.id === archived.id ? archived : row)) }));
    return archived;
  }
}));
