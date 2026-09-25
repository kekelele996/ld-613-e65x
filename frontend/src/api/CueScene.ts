import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import {
  archiveScene as archiveSceneService,
  createSceneDraft,
  deriveSceneDraft,
  listScenes,
  saveSceneDraft,
  tracksOccupyingScene
} from "../services/cueSceneService";
import { StageLightError } from "../errors/StageLightError";
import { ERROR_CODES } from "../constants/errorCodes";

/** controller 层二次包装：service 已抛 StageLightError 时原样透传。 */
function toControllerError(error: unknown): StageLightError {
  if (error instanceof StageLightError) return error;
  return new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
}

export async function listCueScene(): Promise<CueScene[]> {
  return listScenes().catch((error) => {
    throw toControllerError(error);
  });
}

export async function deriveCueScene(sourceId: number): Promise<CueScene> {
  try {
    return await deriveSceneDraft(sourceId);
  } catch (error) {
    throw toControllerError(error);
  }
}

export async function createCueSceneDraft(
  overrides: Partial<CueScene> = {}
): Promise<CueScene> {
  try {
    return await createSceneDraft(overrides);
  } catch (error) {
    throw toControllerError(error);
  }
}

/** 保存草稿（校验失败时 controller 把错误原样上抛，页面展示具体原因）。 */
export async function saveCueScene(
  payload: CueScene,
  fixtures: Fixture[],
  scenes?: CueScene[]
): Promise<CueScene> {
  try {
    return await saveSceneDraft(payload, fixtures, scenes);
  } catch (error) {
    throw toControllerError(error);
  }
}

export async function archiveCueScene(
  id: number,
  tracks?: TimelineTrack[]
): Promise<CueScene> {
  try {
    return await archiveSceneService(id, tracks);
  } catch (error) {
    throw toControllerError(error);
  }
}

export function cueSceneOccupants(
  sceneId: number,
  tracks: TimelineTrack[]
): TimelineTrack[] {
  return tracksOccupyingScene(sceneId, tracks);
}
