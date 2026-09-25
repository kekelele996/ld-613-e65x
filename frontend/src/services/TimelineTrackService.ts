import { listCueScene } from "../api/CueScene";
import { listTimelineTrack, saveTimelineTrack } from "../api/TimelineTrack";
import { LOG_ACTION } from "../constants/logTemplates";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import { ServiceError } from "../utils/errors";
import { writeLog } from "../utils/log";
import { renderMessage } from "../utils/messageTemplate";

/** 轨道改指向新场景：目标必须存在且未归档，已锁定轨道需先解锁 */
export async function repointTrack(trackId: number, newSceneId: number): Promise<TimelineTrack> {
  const [tracks, scenes] = await Promise.all([listTimelineTrack(), listCueScene()]);
  const track = tracks.find((item) => item.id === trackId);
  if (!track) {
    throw new ServiceError("SCENE_NOT_FOUND", `轨道不存在（ID ${trackId}）`, { id: trackId });
  }
  if (track.locked) {
    throw new ServiceError("RBAC_DENIED", `轨道 #${trackId} 已锁定，请先解锁再改指向场景`);
  }
  const target = await requireUsableScene(scenes, newSceneId);
  if (track.cue_scene_id === newSceneId) {
    return track;
  }
  const previous = scenes.find((scene) => scene.id === track.cue_scene_id);
  const updated = await saveTimelineTrack({ ...track, cue_scene_id: newSceneId });
  await writeLog(
    "TimelineTrack",
    LOG_ACTION.TRACK_REPOINT,
    `轨道 #${track.id} 由「${previous?.name ?? track.cue_scene_id}」改指向「${target.name}」(#${target.id})`
  );
  return updated;
}

export async function findTracksReferencingScene(sceneId: number): Promise<TimelineTrack[]> {
  const tracks = await listTimelineTrack();
  return tracks.filter((track) => track.cue_scene_id === sceneId);
}

export async function requireUsableScene(scenes: CueScene[], sceneId: number): Promise<CueScene> {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    throw new ServiceError("SCENE_NOT_FOUND", renderMessage("SCENE_NOT_FOUND", { id: sceneId }), { id: sceneId });
  }
  if (scene.scene_status === "ARCHIVED") {
    throw new ServiceError(
      "TRACK_TARGET_ARCHIVED",
      renderMessage("TRACK_TARGET_ARCHIVED", { name: scene.name }),
      { name: scene.name }
    );
  }
  return scene;
}
