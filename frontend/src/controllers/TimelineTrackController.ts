import { findTracksReferencingScene, repointTrack } from "../services/TimelineTrackService";
import type { TimelineTrack } from "../types/TimelineTrack";
import { ControllerError, ServiceError } from "../utils/errors";

function wrap(error: unknown, fallback: string): ControllerError {
  if (error instanceof ServiceError) return new ControllerError(error.code, error.message, error);
  return new ControllerError("VALIDATION_FAILED", fallback, error);
}

export async function repointTrackController(trackId: number, newSceneId: number): Promise<TimelineTrack> {
  try {
    return await repointTrack(trackId, newSceneId);
  } catch (error) {
    throw wrap(error, "轨道改指向失败，请稍后重试");
  }
}

export async function describeTrackReferencesController(sceneId: number): Promise<TimelineTrack[]> {
  try {
    return await findTracksReferencingScene(sceneId);
  } catch (error) {
    throw wrap(error, "查询轨道引用失败");
  }
}

export { ServiceError };
