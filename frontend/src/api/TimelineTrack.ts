import type { TimelineTrack } from "../types/TimelineTrack";
import type { CueScene } from "../types/CueScene";
import {
  createTrack,
  listTracks,
  setTrackLocked,
  switchTracksToScene,
  updateTrack
} from "../services/timelineTrackService";
import { StageLightError } from "../errors/StageLightError";
import { ERROR_CODES } from "../constants/errorCodes";

function toControllerError(error: unknown): StageLightError {
  if (error instanceof StageLightError) return error;
  return new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
}

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  return listTracks().catch((error) => {
    throw toControllerError(error);
  });
}

export async function saveTimelineTrack(payload: TimelineTrack): Promise<TimelineTrack> {
  try {
    if (payload.id > 0) return await updateTrack(payload);
    return await createTrack(payload);
  } catch (error) {
    throw toControllerError(error);
  }
}

export async function toggleTimelineTrackLock(
  payload: TimelineTrack
): Promise<TimelineTrack> {
  try {
    return await setTrackLocked(payload);
  } catch (error) {
    throw toControllerError(error);
  }
}

/** 轨道改用新场景（旧场景归档前置）。 */
export async function repointTimelineTracks(
  fromSceneId: number,
  toSceneId: number,
  scenes?: CueScene[],
  trackIds?: number[]
): Promise<TimelineTrack[]> {
  try {
    return await switchTracksToScene(fromSceneId, toSceneId, scenes, trackIds);
  } catch (error) {
    throw toControllerError(error);
  }
}
