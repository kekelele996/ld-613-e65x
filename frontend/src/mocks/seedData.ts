import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ShowProject } from "../types/ShowProject";

/** 首次打开 IndexedDB 时的播种数据；之后以库内数据为准 */
export const seedData = {
  fixture: [
    {
      id: 1,
      fixture_code: "PAR-01",
      fixture_type: "PAR",
      position_x: 120,
      position_y: 80,
      dmx_address: 1,
      channel_count: 4,
      color_mode: "RGB"
    },
    {
      id: 2,
      fixture_code: "SPOT-02",
      fixture_type: "SPOT",
      position_x: 300,
      position_y: 60,
      dmx_address: 17,
      channel_count: 8,
      color_mode: "MOVING_HEAD"
    },
    {
      id: 3,
      fixture_code: "WASH-03",
      fixture_type: "WASH",
      position_x: 480,
      position_y: 80,
      dmx_address: 33,
      channel_count: 6,
      color_mode: "RGBW"
    },
    {
      id: 4,
      fixture_code: "BEAM-04",
      fixture_type: "BEAM",
      position_x: 220,
      position_y: 200,
      dmx_address: 49,
      channel_count: 5,
      color_mode: "MOVING_HEAD"
    },
    {
      id: 5,
      fixture_code: "STROBE-05",
      fixture_type: "STROBE",
      position_x: 400,
      position_y: 200,
      dmx_address: 65,
      channel_count: 1,
      color_mode: "DIMMER_ONLY"
    }
  ] as Fixture[],
  cueScene: [
    {
      id: 1,
      name: "开场 1",
      fixture_states: [
        { fixture_id: 1, red: 255, green: 180, blue: 60, brightness: 80 },
        { fixture_id: 2, red: 255, green: 220, blue: 120, brightness: 90 },
        { fixture_id: 3, red: 200, green: 120, blue: 40, brightness: 70 }
      ],
      fade_in_ms: 500,
      hold_ms: 3000,
      priority: 10,
      scene_status: "READY"
    },
    {
      id: 2,
      name: "主唱 2",
      fixture_states: [
        { fixture_id: 2, red: 80, green: 140, blue: 255, brightness: 95 },
        { fixture_id: 3, red: 120, green: 180, blue: 255, brightness: 85 },
        { fixture_id: 4, red: 60, green: 100, blue: 220, brightness: 75 }
      ],
      fade_in_ms: 1000,
      hold_ms: 4000,
      priority: 20,
      scene_status: "READY"
    },
    {
      id: 3,
      name: "尾声 3",
      fixture_states: [
        { fixture_id: 1, red: 255, green: 60, blue: 60, brightness: 60 },
        { fixture_id: 5, red: 255, green: 255, blue: 255, brightness: 40 }
      ],
      fade_in_ms: 2000,
      hold_ms: 5000,
      priority: 5,
      scene_status: "DRAFT"
    },
    {
      id: 4,
      name: "暖场备用",
      fixture_states: [
        { fixture_id: 1, red: 255, green: 240, blue: 200, brightness: 50 },
        { fixture_id: 3, red: 255, green: 240, blue: 200, brightness: 50 }
      ],
      fade_in_ms: 800,
      hold_ms: 6000,
      priority: 1,
      scene_status: "READY"
    }
  ] as CueScene[],
  timelineTrack: [
    { id: 1, cue_scene_id: 1, start_ms: 0, duration_ms: 3500, layer: 1, locked: false },
    { id: 2, cue_scene_id: 2, start_ms: 3500, duration_ms: 5000, layer: 1, locked: false },
    { id: 3, cue_scene_id: 1, start_ms: 0, duration_ms: 3500, layer: 2, locked: true }
  ] as TimelineTrack[],
  showProject: [
    {
      id: 1,
      title: "2026 秋季巡演",
      venue_name: "滨江大剧院",
      fixture_ids: [1, 2, 3, 4, 5],
      track_ids: [1, 2, 3],
      updated_at: "2026-09-20T09:00:00Z"
    }
  ] as ShowProject[]
};
