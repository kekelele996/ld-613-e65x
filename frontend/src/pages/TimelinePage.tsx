import { useEffect, useMemo, useState } from "react";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { ServiceError } from "../utils/errors";
import { formatMs } from "../utils/formatters";
import { StatusBadge } from "../components/common/StatusBadge";

export function TimelinePage() {
  const sceneStore = useCueSceneStore();
  const trackStore = useTimelineTrackStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void sceneStore.load();
    void trackStore.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneMap = useMemo(
    () => new Map(sceneStore.rows.map((scene) => [scene.id, scene])),
    [sceneStore.rows]
  );

  const repoint = async (trackId: number, newSceneId: number) => {
    setActionError(null);
    setSuccess(null);
    if (!newSceneId) return;
    try {
      const updated = await trackStore.repoint(trackId, newSceneId);
      const target = sceneMap.get(updated.cue_scene_id);
      setSuccess(`轨道 #${trackId} 已改指向「${target?.name ?? newSceneId}」，旧场景现在可以归档了。`);
    } catch (error) {
      setActionError(error instanceof ServiceError ? error.message : "轨道改指向失败");
    }
  };

  const selectableScenes = sceneStore.rows.filter((scene) => scene.scene_status !== "ARCHIVED");

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">stage-light / timeline</p>
          <h1>时间轴编排</h1>
          <p className="page-desc">把轨道改指向派生出来的新场景后，旧场景才允许归档；仍被引用的旧场景会在场景页显示占用关系。</p>
        </div>
      </section>

      {actionError ? <div className="action-error" role="alert">{actionError}</div> : null}
      {success ? <div className="action-success" role="status">{success}</div> : null}

      <section className="panel">
        <h2>轨道列表（{trackStore.rows.length}）</h2>
        {trackStore.loading ? <p>加载中…</p> : (
          <div className="table track-table">
            {trackStore.rows.map((track) => {
              const scene = sceneMap.get(track.cue_scene_id);
              return (
                <article key={track.id} className="row track-row">
                  <div className="track-main">
                    <strong>轨道 #{track.id}</strong>
                    <span className="cue-card-meta">
                      图层 {track.layer} · 开始 {formatMs(track.start_ms)} · 时长 {formatMs(track.duration_ms)}
                      {track.locked ? " · 已锁定" : ""}
                    </span>
                  </div>
                  <div className="track-scene">
                    <span>{scene ? scene.name : `场景 #${track.cue_scene_id}（不存在）`}</span>
                    {scene ? <StatusBadge value={scene.scene_status} /> : null}
                  </div>
                  <label className="repoint">
                    <span>改指向</span>
                    <select
                      value=""
                      disabled={track.locked}
                      onChange={(event) => repoint(track.id, Number(event.target.value))}
                    >
                      <option value="">选择新场景…</option>
                      {selectableScenes
                        .filter((item) => item.id !== track.cue_scene_id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}（{item.scene_status === "DRAFT" ? "草稿" : "就绪"}）
                          </option>
                        ))}
                    </select>
                  </label>
                </article>
              );
            })}
          </div>
        )}
        <p className="foot-hint">已锁定轨道需先解锁才能改指向；已归档场景不会出现在候选列表中。</p>
      </section>

      <section className="panel">
        <h2>场景占用关系</h2>
        <div className="table">
          {sceneStore.rows.map((scene) => {
            const refs = trackStore.rows.filter((track) => track.cue_scene_id === scene.id);
            return (
              <article key={scene.id} className="row occupancy-row">
                <strong>{scene.name}</strong>
                <StatusBadge value={scene.scene_status} />
                <span>
                  {scene.scene_status === "ARCHIVED"
                    ? "已归档"
                    : refs.length > 0
                      ? `被 ${refs.length} 条轨道引用：${refs.map((track) => `#${track.id}(图层${track.layer})`).join("、")}`
                      : "无轨道引用，可以归档"}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
