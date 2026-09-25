import { create } from "zustand";
import { listShowProject, saveShowProject } from "../api/ShowProject";
import type { ShowProject } from "../types/ShowProject";

type State = {
  rows: ShowProject[];
  loading: boolean;
  load: () => Promise<void>;
  save: (payload: ShowProject) => Promise<ShowProject>;
};

export const useShowProjectStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    try {
      set({ rows: await listShowProject(), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async save(payload) {
    const saved = await saveShowProject(payload);
    set({ rows: [
      ...get().rows.filter((row) => row.id !== saved.id),
      saved
    ] });
    return saved;
  }
}));
