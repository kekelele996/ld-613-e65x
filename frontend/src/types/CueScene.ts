import type { FixtureState } from "./FixtureState";

export interface CueScene {
  id: number;
  name: string;
  /** 每台灯的颜色/亮度状态，以 JSON 字符串持久化。 */
  fixture_states: FixtureState[];
  fade_in_ms: number;
  hold_ms: number;
  priority: number;
  scene_status: string;
  /** 派生来源场景；手工新建为空，派生草稿记录来源 id。 */
  derived_from_id: number | null;
}
