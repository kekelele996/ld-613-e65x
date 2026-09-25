import { create } from "zustand";
import {
  archiveCueScene,
  createCueSceneDraft,
  deriveCueScene,
  listCueScene,
  saveCueScene
} from "../api/CueScene";
import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";

type State = {
  rows: CueScene[];
  loading: boolean;
  load: () => Promise<void>;
  derive: (sourceId: number) => Promise<CueScene>;
  createDraft: (overrides?: Partial<CueScene>) => Promise<CueScene>;
  /** 保存草稿：校验（缺失灯具/时长/序号）失败时抛出，状态不更新。 */
  saveDraft: (draft: CueScene, fixtures: Fixture[]) => Promise<CueScene>;
  archive: (id: number, tracks?: TimelineTrack[]) => Promise<CueScene>;
};

function upsert(rows: CueScene[], scene: CueScene): CueScene[] {
  return [...rows.filter((row) => row.id !== scene.id), scene].sort(
    (a, b) => a.id - b.id
  );
}

export const useCueSceneStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    try {
      set({ rows: await listCueScene(), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async derive(sourceId) {
    const draft = await deriveCueScene(sourceId);
    set({ rows: upsert(get().rows, draft) });
    return draft;
  },
  async createDraft(overrides) {
    const draft = await createCueSceneDraft(overrides);
    set({ rows: upsert(get().rows, draft) });
    return draft;
  },
  async saveDraft(draft, fixtures) {
    const saved = await saveCueScene(draft, fixtures, get().rows);
    set({ rows: upsert(get().rows, saved) });
    return saved;
  },
  async archive(id, tracks) {
    const archived = await archiveCueScene(id, tracks);
    set({ rows: upsert(get().rows, archived) });
    return archived;
  }
}));
