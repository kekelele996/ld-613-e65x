export interface TimelineTrack {
  id: number;
  cue_scene_id: number;
  start_ms: number;
  duration_ms: number;
  layer: number;
  locked: boolean;
}
