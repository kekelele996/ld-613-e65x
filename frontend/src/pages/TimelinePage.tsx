import { useEffect, useMemo, useState } from "react";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { formatMs } from "../utils/formatters";
import { StageLightError } from "../errors/StageLightError";

export function TimelinePage() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const loadTracks = useTimelineTrackStore((state) => state.load);
  const repoint = useTimelineTrackStore((state) => state.repoint);
  const toggleLock = useTimelineTrackStore((state) => state.toggleLock);

  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);

  const [fromSceneId, setFromSceneId] = useState<number>(0);
  const [toSceneId, setToSceneId] = useState<number>(0);
  const [selectedTrackIds, setSelectedTrackIds] = useState<number[]>([]);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadTracks();
    void loadScenes();
  }, [loadTracks, loadScenes]);

  const sceneMap = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, scene])),
    [scenes]
  );

  const durationMs = useMemo(
    () =>
      tracks.reduce(
        (max, track) => Math.max(max, track.start_ms + track.duration_ms),
        0
      ) + 2000,
    [tracks]
  );

  const layers = useMemo(
    () => Array.from(new Set(tracks.map((track) => track.layer))).sort((a, b) => a - b),
    [tracks]
  );

  // 可供改指向的“新场景”：非归档、且不是源场景自身。
  const targetScenes = scenes.filter(
    (scene) => scene.id !== fromSceneId && scene.scene_status !== "ARCHIVED"
  );
  const fromCandidates = scenes.filter((scene) => scene.scene_status !== "ARCHIVED");
  const affectedTracks = tracks.filter(
    (track) =>
      track.cue_scene_id === fromSceneId &&
      (selectedTrackIds.length === 0 || selectedTrackIds.includes(track.id))
  );

  const toggleTrackPick = (id: number) =>
    setSelectedTrackIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  const handleRepoint = async () => {
    if (!fromSceneId || !toSceneId) {
      setMessage({ kind: "error", text: "请先选择源场景和新场景。" });
      return;
    }
    try {
      await repoint(
        fromSceneId,
        toSceneId,
        scenes,
        selectedTrackIds.length > 0 ? selectedTrackIds : undefined
      );
      const target = sceneMap.get(toSceneId);
      setMessage({
        kind: "ok",
        text: `轨道已改用“${target?.name ?? toSceneId}”，现在旧场景的归档入口会解除占用。`
      });
      setSelectedTrackIds([]);
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof StageLightError
          ? `切换被拦下：${error.message}`
          : error instanceof Error
            ? error.message
            : "切换失败"
      });
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>时间轴轨道</h2>
            <p className="muted">
              轨道改用新场景后，旧场景才允许归档；锁定轨道不会参与播放控制之外的编辑。
            </p>
          </div>
        </div>

        <TimelineRuler durationMs={durationMs} currentMs={0} />

        {tracks.length === 0 ? (
          <EmptyState title="暂无轨道" hint="种子数据被清空后可重新添加。" />
        ) : (
          <div className="track-lanes">
            {layers.map((layer) => (
              <div key={layer} className="track-lane">
                <span className="lane-label">图层 {layer}</span>
                <div className="lane-body">
                  {tracks
                    .filter((track) => track.layer === layer)
                    .map((track) => {
                      const scene = sceneMap.get(track.cue_scene_id);
                      const left = `${(track.start_ms / durationMs) * 100}%`;
                      const width = `${(track.duration_ms / durationMs) * 100}%`;
                      const picked =
                        track.cue_scene_id === fromSceneId &&
                        (selectedTrackIds.length === 0 ||
                          selectedTrackIds.includes(track.id));
                      return (
                        <div
                          key={track.id}
                          className={`track-block${track.locked ? " locked" : ""}${
                            picked && fromSceneId ? " picked" : ""
                          }`}
                          style={{ left, width }}
                          title={scene ? scene.name : `场景 #${track.cue_scene_id} 已缺失`}
                        >
                          <button
                            type="button"
                            className="block-main"
                            onClick={() => {
                              setFromSceneId(track.cue_scene_id);
                              setToSceneId(0);
                              setSelectedTrackIds([]);
                            }}
                          >
                            <strong>
                              {scene ? scene.name : `场景 #${track.cue_scene_id} 已缺失`}
                            </strong>
                            <span>
                              #{track.id} · {formatMs(track.duration_ms)} ·{" "}
                              {track.start_ms}ms 起
                            </span>
                            <StatusBadge value={scene ? scene.scene_status : "DISABLED"} />
                          </button>
                          <button
                            type="button"
                            className="lock-btn"
                            onClick={() => void toggleLock(track)}
                            title="锁定/解锁轨道"
                          >
                            {track.locked ? "🔒" : "🔓"}
                          </button>
                          {track.cue_scene_id === fromSceneId ? (
                            <label className="pick-check">
                              <input
                                type="checkbox"
                                checked={
                                  selectedTrackIds.length === 0
                                    ? true
                                    : selectedTrackIds.includes(track.id)
                                }
                                onChange={() => toggleTrackPick(track.id)}
                              />
                            </label>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel repoint-panel">
        <h2>轨道改用新场景（旧场景归档前置）</h2>
        <div className="repoint-form">
          <label>
            源场景（旧）
            <select
              value={fromSceneId}
              onChange={(event) => {
                setFromSceneId(Number(event.target.value));
                setSelectedTrackIds([]);
              }}
            >
              <option value={0}>选择要被替换的旧场景…</option>
              {fromCandidates.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}（{scene.scene_status}）
                </option>
              ))}
            </select>
          </label>
          <label>
            新场景
            <select
              value={toSceneId}
              onChange={(event) => setToSceneId(Number(event.target.value))}
            >
              <option value={0}>选择派生保存后的新场景…</option>
              {targetScenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}（{scene.scene_status}）
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={!fromSceneId || !toSceneId}
            onClick={() => void handleRepoint()}
          >
            改指向（{affectedTracks.length} 条轨道）
          </button>
        </div>
        {fromSceneId ? (
          <p className="muted">
            受影响轨道：
            {affectedTracks.length === 0
              ? "无（该场景当前没有轨道引用）"
              : affectedTracks
                  .map((track) => `#${track.id}（图层 ${track.layer}）`)
                  .join("、")}
            ；不勾选任何轨道时，默认改指向该场景的全部引用。
          </p>
        ) : null}
        {message ? (
          <div className={`alert ${message.kind === "ok" ? "ok" : "error"}`}>
            {message.text}
          </div>
        ) : null}
      </section>
    </div>
  );
}
