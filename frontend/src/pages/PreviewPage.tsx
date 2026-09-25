import { useEffect, useMemo, useState } from "react";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import { formatMs } from "../utils/formatters";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { StatusBadge } from "../components/common/StatusBadge";

export function PreviewPage() {
  const fixtureStore = useFixtureStore();
  const sceneStore = useCueSceneStore();
  const trackStore = useTimelineTrackStore();
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
  const page = useTimelinePlayback(trackStore.rows);

  useEffect(() => {
    void fixtureStore.load();
    void sceneStore.load();
    void trackStore.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneMap = useMemo(
    () => new Map(sceneStore.rows.map((scene) => [scene.id, scene])),
    [sceneStore.rows]
  );
  const activeScene = activeSceneId !== null ? sceneMap.get(activeSceneId) : undefined;
  const lightByFixture = new Map(activeScene?.fixture_states.map((state) => [state.fixture_id, state]) ?? []);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">stage-light / preview</p>
          <h1>舞台预览</h1>
          <p className="page-desc">下方数据来自 IndexedDB：重新打开页面后，派生出的场景与轨道指向仍然保留。</p>
        </div>
      </section>

      <section className="panel">
        <h2>二维舞台</h2>
        <div className="stage-canvas">
          {fixtureStore.rows.map((fixture) => {
            const light = lightByFixture.get(fixture.id);
            return (
              <button
                type="button"
                key={fixture.id}
                className="stage-fixture"
                style={{ left: fixture.position_x, top: fixture.position_y }}
                title={`${fixture.fixture_code}${light ? ` · 亮度 ${light.brightness}%` : " · 当前场景未使用"}`}
              >
                <FixtureIcon code={fixture.fixture_code} light={light} size={36} />
                <span>{fixture.fixture_code}</span>
              </button>
            );
          })}
        </div>
        <p className="foot-hint">{activeScene ? `预览中：「${activeScene.name}」` : "点击下方场景查看灯光效果"}</p>
      </section>

      <section className="workbench">
        <div className="panel wide">
          <h2>场景（含派生草稿）</h2>
          <div className="table">
            {sceneStore.rows.map((scene) => (
              <article key={scene.id} className="row preview-scene-row">
                <button type="button" className="link-btn" onClick={() => setActiveSceneId(scene.id)}>
                  {scene.name}
                </button>
                <StatusBadge value={scene.scene_status} />
                <span className="cue-card-meta">{scene.fixture_states.length} 台灯 · 淡入 {formatMs(scene.fade_in_ms)} · 优先级 {scene.priority}</span>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>轨道指向</h2>
          <div className="table">
            {page.pageRows.map((track) => {
              const scene = sceneMap.get(track.cue_scene_id);
              return (
                <article key={track.id} className="row">
                  <strong>#{track.id}</strong>
                  <span>{scene ? scene.name : `缺失场景 #${track.cue_scene_id}`}</span>
                  <span className="cue-card-meta">图层 {track.layer}{track.locked ? " · 锁定" : ""}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
