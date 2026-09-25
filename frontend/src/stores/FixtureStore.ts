import { create } from "zustand";
import { listFixture, removeFixture, saveFixture } from "../api/Fixture";
import type { Fixture } from "../types/Fixture";

type State = {
  rows: Fixture[];
  loading: boolean;
  load: () => Promise<void>;
  save: (payload: Fixture) => Promise<Fixture>;
  remove: (id: number) => Promise<void>;
};

export const useFixtureStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    try {
      set({ rows: await listFixture(), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async save(payload) {
    const saved = await saveFixture(payload);
    set({
      rows: [
        ...get().rows.filter((row) => row.id !== saved.id),
        saved
      ].sort((a, b) => a.id - b.id)
    });
    return saved;
  },
  async remove(id) {
    await removeFixture(id);
    set({ rows: get().rows.filter((row) => row.id !== id) });
  }
}));
