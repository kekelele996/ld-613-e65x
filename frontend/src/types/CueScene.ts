import type { CueStatus } from "./CueStatus";

/** 单台灯在某个场景中的灯光状态：颜色用 0-255 三通道，亮度 0-100 */
export interface FixtureLightState {
  fixture_id: number;
  red: number;
  green: number;
  blue: number;
  brightness: number;
}

export interface CueScene {
  id: number;
  name: string;
  fixture_states: FixtureLightState[];
  fade_in_ms: number;
  hold_ms: number;
  priority: number;
  scene_status: CueStatus;
}

/** 场景草稿（未保存前只存在于页面与 store 中，不写库） */
export type CueSceneDraft = CueScene;

/** 保存场景时逐条返回的问题，供页面停下并指出原因 */
export interface CueSceneIssue {
  code:
    | "SCENE_FIXTURE_MISSING"
    | "SCENE_DURATION_INVALID"
    | "SCENE_SEQUENCE_DUPLICATE"
    | "SCENE_NAME_EMPTY";
  message: string;
  fixture_id?: number;
  field?: "fade_in_ms" | "hold_ms" | "name";
}
