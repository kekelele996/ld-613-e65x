import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import { ERROR_CODES } from "../constants/errorCodes";
import { StageLightError } from "../errors/StageLightError";
import { isSameSequence, parseSceneName } from "./sceneNameSequence";

const MAX_DURATION_MS = 3_600_000;

export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_DURATION_MS;
}

/**
 * 保存草稿前的三道关卡（按顺序，命中即停下并指出原因）：
 * 1. 引用缺失灯具；
 * 2. 渐变/保持时长非法；
 * 3. 名称末尾序号与其它场景重复。
 */
export function validateSceneDraft(
  draft: CueScene,
  scenes: CueScene[],
  fixtures: Fixture[]
): void {
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const missing = draft.fixture_states
    .map((state) => state.fixture_id)
    .filter((id, index, all) => all.indexOf(id) === index)
    .filter((id) => !fixtureMap.has(id));

  if (missing.length > 0) {
    const codes = missing.map((id) => `#${id}`).join("、");
    throw new StageLightError(ERROR_CODES.SCENE_FIXTURE_MISSING, { codes });
  }

  if (!isNonNegativeInteger(draft.fade_in_ms)) {
    throw new StageLightError(ERROR_CODES.SCENE_DURATION_INVALID, {
      field: "渐变",
      value: JSON.stringify(draft.fade_in_ms)
    });
  }
  if (!isNonNegativeInteger(draft.hold_ms)) {
    throw new StageLightError(ERROR_CODES.SCENE_DURATION_INVALID, {
      field: "保持",
      value: JSON.stringify(draft.hold_ms)
    });
  }

  const parsed = parseSceneName(draft.name);
  if (parsed.sequence === null) {
    throw new StageLightError(ERROR_CODES.SCENE_DUPLICATE_SEQUENCE, {
      name: draft.name,
      sequence: "（缺失）",
      owner: "无"
    });
  }
  const owner = scenes.find(
    (scene) =>
      scene.id !== draft.id &&
      isSameSequence(scene.name, parsed.base, parsed.sequence as number)
  );
  if (owner) {
    throw new StageLightError(ERROR_CODES.SCENE_DUPLICATE_SEQUENCE, {
      name: draft.name,
      sequence: parsed.sequence,
      owner: owner.name
    });
  }
}

/** 归档前置检查：仍有轨道引用时拒绝，并说明占用关系。 */
export function assertSceneArchivable(
  scene: CueScene,
  tracks: TimelineTrack[]
): TimelineTrack[] {
  const occupied = tracks.filter((track) => track.cue_scene_id === scene.id);
  if (occupied.length > 0) {
    throw new StageLightError(ERROR_CODES.SCENE_IN_USE_BY_TRACK, {
      count: occupied.length,
      tracks: occupied.map((track) => `#${track.id}`).join("、")
    });
  }
  return occupied;
}
