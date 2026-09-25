import type { TimelineTrack } from "../types/TimelineTrack";
import type { CueScene } from "../types/CueScene";
import type { StoreName } from "../db/schema";
import { idb } from "../db/indexedDb";
import { createDefaultTimelineTrack } from "../constructors/TimelineTrackConstructor";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { ERROR_CODES } from "../constants/errorCodes";
import { writeLog } from "../utils/logger";
import { nextId } from "../utils/ids";
import { StageLightError } from "../errors/StageLightError";

const STORE: StoreName = "timelineTrack";

export async function listTracks(): Promise<TimelineTrack[]> {
  const rows = await idb.getAll<TimelineTrack>(STORE);
  return rows.sort((a, b) => a.start_ms - b.start_ms || a.layer - b.layer);
}

export async function createTrack(input: Partial<TimelineTrack>): Promise<TimelineTrack> {
  const rows = await listTracks();
  const track = createDefaultTimelineTrack({ ...input, id: nextId(rows) });
  await idb.put(STORE, track);
  writeLog("TimelineTrack", "create", LOG_TEMPLATES.TimelineTrack.create, {
    layer: track.layer,
    start: track.start_ms
  });
  return track;
}

export async function updateTrack(track: TimelineTrack): Promise<TimelineTrack> {
  await idb.put(STORE, track);
  writeLog("TimelineTrack", "update", LOG_TEMPLATES.TimelineTrack.update, {
    id: track.id,
    from: "旧值",
    to: track.cue_scene_id
  });
  return track;
}

export async function setTrackLocked(track: TimelineTrack): Promise<TimelineTrack> {
  const updated = { ...track, locked: !track.locked };
  await idb.put(STORE, updated);
  writeLog("TimelineTrack", "lock", LOG_TEMPLATES.TimelineTrack.lock, {
    id: updated.id,
    locked: updated.locked ? "已锁定" : "已解锁"
  });
  return updated;
}

/**
 * 轨道改用新场景：批量（或单条）把引用 fromSceneId 的轨道改指向 toSceneId。
 * 这是“旧场景可归档”的前置动作；目标场景不存在时停下并指出。
 */
export async function switchTracksToScene(
  fromSceneId: number,
  toSceneId: number,
  scenes?: CueScene[],
  trackIds?: number[]
): Promise<TimelineTrack[]> {
  const allScenes = scenes ?? (await idb.getAll<CueScene>("cueScene"));
  const target = allScenes.find((scene) => scene.id === toSceneId);
  if (!target) {
    throw new StageLightError(ERROR_CODES.TRACK_SCENE_MISSING, { id: toSceneId });
  }
  if (target.scene_status === "ARCHIVED") {
    throw new StageLightError(ERROR_CODES.TRACK_SCENE_MISSING, { id: toSceneId });
  }

  const tracks = await listTracks();
  const idFilter = trackIds ? new Set(trackIds) : null;
  const updated = tracks.map((track) => {
    const matched =
      track.cue_scene_id === fromSceneId && (!idFilter || idFilter.has(track.id));
    return matched ? { ...track, cue_scene_id: toSceneId } : track;
  });
  const changed = updated.filter((track, index) => track !== tracks[index]);
  if (changed.length > 0) {
    await idb.bulkPut(STORE, updated);
    writeLog("TimelineTrack", "switch", LOG_TEMPLATES.TimelineTrack.switch, {
      count: changed.length,
      from: fromSceneId,
      to: toSceneId
    });
  }
  return updated;
}
