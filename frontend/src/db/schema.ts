export const DB_NAME = "stage-light";
export const DB_VERSION = 1;

export const STORES = {
  fixture: "fixture",
  cueScene: "cueScene",
  timelineTrack: "timelineTrack",
  showProject: "showProject"
} as const;

export type StoreName = keyof typeof STORES;
