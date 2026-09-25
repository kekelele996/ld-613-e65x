import type { TimelineTrack } from "../types/TimelineTrack";

export const createDefaultTimelineTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: 0,
  cue_scene_id: 0,
  start_ms: 0,
  duration_ms: 1000,
  layer: 1,
  locked: false,
  ...overrides
});

export const createTimelineTrackForm = createDefaultTimelineTrack;
export const createTimelineTrackResponse = createDefaultTimelineTrack;
