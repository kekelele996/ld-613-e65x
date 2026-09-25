import { useState } from "react";
import type { CueScene } from "../../types/CueScene";
import type { TimelineTrack } from "../../types/TimelineTrack";
import { tracksOccupyingScene } from "../../services/cueSceneService";

interface ArchiveSceneButtonProps {
  scene: CueScene;
  tracks: TimelineTrack[];
  onArchive: (id: number) => Promise<void>;
}

/**
 * 归档入口：
 * - 无轨道占用 → 直接归档；
 * - 仍有轨道引用 → 拦截并展开占用关系说明（哪些轨道、在哪个图层）。
 */
export function ArchiveSceneButton({
  scene,
  tracks,
  onArchive
}: ArchiveSceneButtonProps) {
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);

  const occupants = tracksOccupyingScene(scene.id, tracks);
  const occupied = occupants.length > 0;

  const handleClick = async () => {
    if (occupied) {
      setExplain(
        `场景“${scene.name}”仍被 ${occupants.length} 条轨道占用：` +
          occupants
            .map((track) => `轨道#${track.id}（图层 ${track.layer}，${track.start_ms}ms 起）`)
            .join("、") +
          "。请先到“时间轴编排”把这些轨道改指向新场景，旧场景才可归档。"
      );
      return;
    }
    setBusy(true);
    try {
      await onArchive(scene.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="archive-wrap">
      <button
        type="button"
        className={`btn ghost mini${occupied ? " blocked" : ""}`}
        disabled={busy || scene.scene_status === "ARCHIVED"}
        title={occupied ? "仍有轨道引用，点开查看占用关系" : "无轨道占用，可以归档"}
        onClick={handleClick}
      >
        {scene.scene_status === "ARCHIVED" ? "已归档" : occupied ? "归档（被占用）" : "归档"}
      </button>
      {explain ? (
        <span className="occupancy-pop">
          {explain}
          <button type="button" className="btn ghost mini" onClick={() => setExplain(null)}>
            知道了
          </button>
        </span>
      ) : null}
    </span>
  );
}
