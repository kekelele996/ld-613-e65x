import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ShowProject } from "../types/ShowProject";
import type { StoreName } from "../db/schema";

/**
 * 本地 mock/种子数据：首次打开 IndexedDB 时灌入。
 * 禁止接入第三方 API，巡演排练数据全部来自这里或用户在页面上的编辑。
 */
const fixture: Fixture[] = [
  { id: 1, fixture_code: "PAR-01", fixture_type: "PAR", position_x: 120, position_y: 120, dmx_address: 1, channel_count: 3, color_mode: "RGB" },
  { id: 2, fixture_code: "PAR-02", fixture_type: "PAR", position_x: 480, position_y: 120, dmx_address: 4, channel_count: 3, color_mode: "RGB" },
  { id: 3, fixture_code: "WASH-01", fixture_type: "WASH", position_x: 200, position_y: 70, dmx_address: 7, channel_count: 4, color_mode: "RGBW" },
  { id: 4, fixture_code: "WASH-02", fixture_type: "WASH", position_x: 400, position_y: 70, dmx_address: 11, channel_count: 4, color_mode: "RGBW" },
  { id: 5, fixture_code: "SPOT-01", fixture_type: "SPOT", position_x: 70, position_y: 300, dmx_address: 15, channel_count: 1, color_mode: "DIMMER_ONLY" },
  { id: 6, fixture_code: "SPOT-02", fixture_type: "SPOT", position_x: 530, position_y: 300, dmx_address: 16, channel_count: 1, color_mode: "DIMMER_ONLY" },
  { id: 7, fixture_code: "BEAM-01", fixture_type: "BEAM", position_x: 300, position_y: 230, dmx_address: 17, channel_count: 8, color_mode: "MOVING_HEAD" },
  { id: 8, fixture_code: "STROBE-01", fixture_type: "STROBE", position_x: 300, position_y: 40, dmx_address: 25, channel_count: 2, color_mode: "DIMMER_ONLY" }
];

const warm = (brightness: number) => ({ color: "#ffb347", brightness });
const cueScene: CueScene[] = [
  {
    id: 1,
    name: "开场暖场 1",
    fixture_states: [
      { fixture_id: 1, ...warm(60) },
      { fixture_id: 2, ...warm(60) },
      { fixture_id: 3, ...warm(70) },
      { fixture_id: 4, ...warm(70) },
      { fixture_id: 5, color: "#ffffff", brightness: 35 },
      { fixture_id: 6, color: "#ffffff", brightness: 35 },
      { fixture_id: 7, color: "#ff8c1a", brightness: 50 },
      { fixture_id: 8, color: "#ffd9a0", brightness: 20 }
    ],
    fade_in_ms: 2000,
    hold_ms: 8000,
    priority: 5,
    scene_status: "READY",
    derived_from_id: null
  },
  {
    id: 2,
    name: "主唱追光 1",
    fixture_states: [
      { fixture_id: 1, color: "#330000", brightness: 8 },
      { fixture_id: 2, color: "#330000", brightness: 8 },
      { fixture_id: 3, color: "#551100", brightness: 12 },
      { fixture_id: 4, color: "#551100", brightness: 12 },
      { fixture_id: 5, color: "#ffffff", brightness: 95 },
      { fixture_id: 6, color: "#ffffff", brightness: 95 },
      { fixture_id: 7, color: "#fff7e0", brightness: 80 },
      { fixture_id: 8, color: "#220000", brightness: 0 }
    ],
    fade_in_ms: 500,
    hold_ms: 6000,
    priority: 8,
    scene_status: "READY",
    derived_from_id: null
  },
  {
    id: 3,
    name: "慢歌蓝调 2",
    fixture_states: [
      { fixture_id: 1, color: "#2266ff", brightness: 40 },
      { fixture_id: 2, color: "#2266ff", brightness: 40 },
      { fixture_id: 3, color: "#1a3fb0", brightness: 45 },
      { fixture_id: 4, color: "#1a3fb0", brightness: 45 },
      { fixture_id: 5, color: "#88aaff", brightness: 25 },
      { fixture_id: 6, color: "#88aaff", brightness: 25 },
      { fixture_id: 7, color: "#4d79ff", brightness: 35 },
      { fixture_id: 8, color: "#10204d", brightness: 10 }
    ],
    fade_in_ms: 4000,
    hold_ms: 10000,
    priority: 3,
    scene_status: "DRAFT",
    derived_from_id: null
  },
  {
    id: 4,
    name: "旧版谢幕 1",
    fixture_states: [
      { fixture_id: 1, color: "#ffe08a", brightness: 80 },
      { fixture_id: 2, color: "#ffe08a", brightness: 80 },
      { fixture_id: 3, color: "#fff2c2", brightness: 85 },
      { fixture_id: 4, color: "#fff2c2", brightness: 85 },
      { fixture_id: 5, color: "#ffffff", brightness: 70 },
      { fixture_id: 6, color: "#ffffff", brightness: 70 },
      { fixture_id: 7, color: "#ffd966", brightness: 60 },
      { fixture_id: 8, color: "#fff2c2", brightness: 90 }
    ],
    fade_in_ms: 3000,
    hold_ms: 5000,
    priority: 2,
    scene_status: "ARCHIVED",
    derived_from_id: null
  }
];

const timelineTrack: TimelineTrack[] = [
  { id: 1, cue_scene_id: 1, start_ms: 0, duration_ms: 10000, layer: 1, locked: false },
  { id: 2, cue_scene_id: 3, start_ms: 10000, duration_ms: 14000, layer: 1, locked: false },
  { id: 3, cue_scene_id: 2, start_ms: 24000, duration_ms: 6500, layer: 2, locked: true },
  { id: 4, cue_scene_id: 1, start_ms: 24000, duration_ms: 6500, layer: 1, locked: false }
];

const showProject: ShowProject[] = [
  {
    id: 1,
    title: "2026 秋季巡演 · 南京站",
    venue_name: "南京奥体中心体育馆",
    fixture_ids: [1, 2, 3, 4, 5, 6, 7, 8],
    track_ids: [1, 2, 3, 4],
    updated_at: "2026-09-20T09:00:00Z"
  }
];

export const seedRows: Record<StoreName, unknown[]> = {
  fixture,
  cueScene,
  timelineTrack,
  showProject
};

/** 兼容旧引用：main 页面之外的模块仍可按旧名读取种子表。 */
export const mockData = {
  fixture,
  cueScene,
  timelineTrack,
  showProject
};
