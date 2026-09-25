import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { StoreName } from "../db/schema";
import { idb } from "../db/indexedDb";
import {
  createDefaultCueScene,
  createDerivedCueSceneDraft
} from "../constructors/CueSceneConstructor";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { ERROR_CODES } from "../constants/errorCodes";
import { writeLog } from "../utils/logger";
import { nextId } from "../utils/ids";
import { StageLightError } from "../errors/StageLightError";
import {
  assertSceneArchivable,
  validateSceneDraft
} from "./cueSceneValidator";
import {
  buildSceneName,
  nextUnoccupiedSequence,
  parseSceneName
} from "./sceneNameSequence";

const STORE: StoreName = "cueScene";

export async function listScenes(): Promise<CueScene[]> {
  const rows = await idb.getAll<CueScene>(STORE);
  return rows.sort((a, b) => a.id - b.id);
}

export async function getScene(id: number): Promise<CueScene | undefined> {
  return idb.get<CueScene>(STORE, id);
}

/**
 * 从已有场景派生草稿：
 * - 带上灯具状态、渐变/保持时间、优先级（构造器深拷贝，原场景不受影响）；
 * - 名称在基名后补一个未占用序号；
 * - 派生结果直接作为 DRAFT 落库，随后可逐灯调整再“保存”。
 */
export async function deriveSceneDraft(sourceId: number): Promise<CueScene> {
  const scenes = await listScenes();
  const source = scenes.find((scene) => scene.id === sourceId);
  if (!source) {
    throw new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
  }

  const { base } = parseSceneName(source.name);
  const sequence = nextUnoccupiedSequence(
    base,
    scenes.map((scene) => scene.name)
  );
  const draft = createDerivedCueSceneDraft(
    source,
    nextId(scenes),
    buildSceneName(base, sequence)
  );
  await idb.put(STORE, draft);
  writeLog("CueScene", "derive", LOG_TEMPLATES.CueScene.derive, {
    source: source.name,
    name: draft.name,
    fade: draft.fade_in_ms,
    hold: draft.hold_ms,
    priority: draft.priority
  });
  return draft;
}

export async function createSceneDraft(
  overrides: Partial<CueScene> = {}
): Promise<CueScene> {
  const scenes = await listScenes();
  const scene = createDefaultCueScene({
    ...overrides,
    id: nextId(scenes),
    scene_status: "DRAFT"
  });
  await idb.put(STORE, scene);
  writeLog("CueScene", "create", LOG_TEMPLATES.CueScene.create, {
    name: scene.name,
    priority: scene.priority,
    status: scene.scene_status
  });
  return scene;
}

/**
 * 保存草稿：先跑三道校验（缺失灯具 / 时长非法 / 序号重复），
 * 命中任一即抛出 StageLightError，不会写入；
 * 通过后由 DRAFT 转为 READY。
 */
export async function saveSceneDraft(
  draft: CueScene,
  fixtures: Fixture[],
  scenes?: CueScene[]
): Promise<CueScene> {
  const allScenes = scenes ?? (await listScenes());
  validateSceneDraft(draft, allScenes, fixtures);

  const saved: CueScene = { ...draft, scene_status: "READY" };
  await idb.put(STORE, saved);
  writeLog("CueScene", "save", LOG_TEMPLATES.CueScene.save, {
    name: saved.name,
    count: saved.fixture_states.length
  });
  return saved;
}

/**
 * 归档场景：轨道改用新场景后才允许归档；
 * 仍有轨道引用时抛出带占用关系（轨道编号列表）的错误。
 */
export async function archiveScene(
  id: number,
  tracks?: TimelineTrack[]
): Promise<CueScene> {
  const tracksForCheck = tracks ?? (await idb.getAll<TimelineTrack>("timelineTrack"));
  const scene = await getScene(id);
  if (!scene) {
    throw new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
  }
  assertSceneArchivable(scene, tracksForCheck);

  const archived = { ...scene, scene_status: "ARCHIVED" };
  await idb.put(STORE, archived);
  writeLog("CueScene", "archive", LOG_TEMPLATES.CueScene.archive, {
    name: archived.name,
    id: archived.id
  });
  return archived;
}

/** 查询占用某场景的轨道，供归档入口说明占用关系。 */
export function tracksOccupyingScene(
  sceneId: number,
  tracks: TimelineTrack[]
): TimelineTrack[] {
  return tracks.filter((track) => track.cue_scene_id === sceneId);
}
