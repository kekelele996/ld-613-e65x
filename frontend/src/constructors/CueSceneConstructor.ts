import type { CueScene } from "../types/CueScene";
import type { FixtureState } from "../types/FixtureState";

export const createDefaultCueScene = (overrides: Partial<CueScene> = {}): CueScene => ({
  id: 0,
  name: "新建场景 1",
  fixture_states: [],
  fade_in_ms: 1000,
  hold_ms: 5000,
  priority: 5,
  scene_status: "DRAFT",
  derived_from_id: null,
  ...overrides
});

export const createCueSceneForm = createDefaultCueScene;
export const createCueSceneResponse = createDefaultCueScene;

/**
 * 派生草稿构造器：带上原场景的灯具状态、渐变时间和优先级（深拷贝，原场景不受影响）。
 * 名称与 id 由 service 层按未占用序号补齐后落库。
 */
export function createDerivedCueSceneDraft(
  source: CueScene,
  nextSceneId: number,
  draftName: string
): CueScene {
  const states: FixtureState[] = source.fixture_states.map((state) => ({ ...state }));
  return createDefaultCueScene({
    id: nextSceneId,
    name: draftName,
    fixture_states: states,
    fade_in_ms: source.fade_in_ms,
    hold_ms: source.hold_ms,
    priority: source.priority,
    scene_status: "DRAFT",
    derived_from_id: source.derived_from_id ?? source.id
  });
}
