import { archiveScene, deriveSceneDraft, findOccupyingTracks, persistSceneDraft, validateSceneDraft } from "../services/CueSceneService";
import type { CueScene, CueSceneDraft, CueSceneIssue } from "../types/CueScene";
import { ControllerError, ServiceError } from "../utils/errors";

/** controller 层：把 ServiceError 再包装一层 ControllerError，禁止在全局位置吞掉异常 */
function wrap(error: unknown, fallback: string): ControllerError {
  if (error instanceof ServiceError) return new ControllerError(error.code, error.message, error);
  return new ControllerError("VALIDATION_FAILED", fallback, error);
}

export async function deriveSceneDraftController(sourceId: number): Promise<CueSceneDraft> {
  try {
    return await deriveSceneDraft(sourceId);
  } catch (error) {
    throw wrap(error, "派生草稿失败，请稍后重试");
  }
}

export async function validateSceneDraftController(scene: CueSceneDraft): Promise<CueSceneIssue[]> {
  try {
    return await validateSceneDraft(scene);
  } catch (error) {
    throw wrap(error, "场景校验失败，请稍后重试");
  }
}

export async function persistSceneDraftController(scene: CueSceneDraft): Promise<CueScene> {
  try {
    return await persistSceneDraft(scene);
  } catch (error) {
    throw wrap(error, "场景保存失败，请检查表单后重试");
  }
}

export async function archiveSceneController(sceneId: number): Promise<CueScene> {
  try {
    return await archiveScene(sceneId);
  } catch (error) {
    throw wrap(error, "场景归档失败");
  }
}

export async function describeSceneOccupancyController(sceneId: number) {
  try {
    const tracks = await findOccupyingTracks(sceneId);
    return { canArchive: tracks.length === 0, tracks };
  } catch (error) {
    throw wrap(error, "查询场景占用关系失败");
  }
}

export { ServiceError };
