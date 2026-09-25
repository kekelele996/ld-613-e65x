import { listCueScene, saveCueScene } from "../api/CueScene";
import { listFixture } from "../api/Fixture";
import { listTimelineTrack } from "../api/TimelineTrack";
import { createDerivedCueSceneDraft } from "../constructors/CueSceneConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_ACTION } from "../constants/logTemplates";
import type { CueScene, CueSceneDraft, CueSceneIssue } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import { extractSceneSequence, isValidDuration } from "../utils/formatters";
import { writeLog } from "../utils/log";
import { renderMessage } from "../utils/messageTemplate";
import { ServiceError } from "../utils/errors";

/** 保存前校验：引用灯具是否存在、时长是否合法、序号是否被占用。返回全部问题，供页面逐条指出 */
export async function validateSceneDraft(scene: CueSceneDraft): Promise<CueSceneIssue[]> {
  const [fixtures, scenes, tracks] = await Promise.all([
    listFixture(),
    listCueScene(),
    listTimelineTrack()
  ]);
  return validateSceneDraftWith(scene, fixtures, scenes, tracks);
}

export function validateSceneDraftWith(
  scene: CueSceneDraft,
  fixtures: Fixture[],
  scenes: CueScene[],
  _tracks: TimelineTrack[]
): CueSceneIssue[] {
  const issues: CueSceneIssue[] = [];
  const name = scene.name.trim();

  if (!name) {
    issues.push({ code: "SCENE_NAME_EMPTY", message: renderMessage("SCENE_NAME_EMPTY"), field: "name" });
  }

  const fixtureIds = new Set(fixtures.map((fixture) => fixture.id));
  for (const state of scene.fixture_states) {
    if (!fixtureIds.has(state.fixture_id)) {
      issues.push({
        code: "SCENE_FIXTURE_MISSING",
        fixture_id: state.fixture_id,
        message: renderMessage("SCENE_FIXTURE_MISSING", { fixtureId: state.fixture_id })
      });
    }
  }

  if (!isValidDuration(scene.fade_in_ms)) {
    issues.push({
      code: "SCENE_DURATION_INVALID",
      field: "fade_in_ms",
      message: renderMessage("SCENE_DURATION_INVALID", { fieldLabel: "淡入时间" })
    });
  }
  if (!isValidDuration(scene.hold_ms)) {
    issues.push({
      code: "SCENE_DURATION_INVALID",
      field: "hold_ms",
      message: renderMessage("SCENE_DURATION_INVALID", { fieldLabel: "保持时间" })
      });
  }

  const seq = extractSceneSequence(name);
  if (seq !== null) {
    const occupant = scenes.find((other) => other.id !== scene.id && extractSceneSequence(other.name) === seq);
    if (occupant) {
      issues.push({
        code: "SCENE_SEQUENCE_DUPLICATE",
        message: renderMessage("SCENE_SEQUENCE_DUPLICATE", { seq, name: occupant.name })
      });
    }
  }

  return issues;
}

/** 从已有场景派生草稿：带灯具状态/渐变时间/优先级，名称补未占用序号，原场景不受影响 */
export async function deriveSceneDraft(sourceId: number): Promise<CueSceneDraft> {
  const scenes = await listCueScene();
  const source = scenes.find((scene) => scene.id === sourceId);
  if (!source) {
    throw new ServiceError("SCENE_NOT_FOUND", renderMessage("SCENE_NOT_FOUND", { id: sourceId }), { id: sourceId });
  }
  const draft = await createDerivedCueSceneDraft(source, scenes.map((scene) => scene.name));
  await writeLog(
    "CueScene",
    LOG_ACTION.CUE_SCENE_DERIVE,
    `从场景「${source.name}」(#${source.id}) 派生出草稿「${draft.name}」(#${draft.id})`
  );
  return draft;
}

/** 校验通过才落库；有任何问题就抛出，调用方负责停下并指出原因 */
export async function persistSceneDraft(scene: CueSceneDraft): Promise<CueScene> {
  const issues = await validateSceneDraft(scene);
  if (issues.length > 0) {
    throw new ServiceError("VALIDATION_FAILED", issues.map((issue) => issue.message).join("；"), { issues: issues.length });
  }
  const isCreate = (await listCueScene()).every((existing) => existing.id !== scene.id);
  const saved = await saveCueScene({ ...scene, name: scene.name.trim() });
  await writeLog(
    "CueScene",
    isCreate ? LOG_ACTION.CUE_SCENE_CREATE : LOG_ACTION.CUE_SCENE_UPDATE,
    `${isCreate ? "创建" : "更新"}场景「${saved.name}」(#${saved.id})，灯具 ${saved.fixture_states.length} 台`
  );
  return saved;
}

/** 查询仍引用该场景的轨道，供归档入口说明占用关系 */
export async function findOccupyingTracks(sceneId: number): Promise<TimelineTrack[]> {
  const tracks = await listTimelineTrack();
  return tracks.filter((track) => track.cue_scene_id === sceneId);
}

/** 归档：没有任何轨道引用时才允许；否则抛出带占用轨道信息的异常 */
export async function archiveScene(sceneId: number): Promise<CueScene> {
  const scenes = await listCueScene();
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    throw new ServiceError("SCENE_NOT_FOUND", renderMessage("SCENE_NOT_FOUND", { id: sceneId }), { id: sceneId });
  }
  const occupiedBy = await findOccupyingTracks(sceneId);
  if (occupiedBy.length > 0) {
    const trackLabels = occupiedBy.map((track) => `#${track.id}(图层${track.layer})`).join("、");
    await writeLog(
      "CueScene",
      LOG_ACTION.CUE_SCENE_ARCHIVE_BLOCKED,
      `归档「${scene.name}」被拦截：轨道 ${trackLabels} 仍在引用`
    );
    throw new ServiceError(
      "SCENE_ARCHIVE_IN_USE",
      renderMessage("SCENE_ARCHIVE_IN_USE", { count: occupiedBy.length, tracks: trackLabels }),
      { count: occupiedBy.length, tracks: trackLabels }
    );
  }
  const archived = await saveCueScene({ ...scene, scene_status: "ARCHIVED" });
  await writeLog("CueScene", LOG_ACTION.CUE_SCENE_STATUS, `场景「${archived.name}」(#${archived.id}) 已归档`);
  return archived;
}
