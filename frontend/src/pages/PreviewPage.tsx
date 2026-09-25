import { useEffect, useMemo, useState } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { StageCanvas } from "../components/common/StageCanvas";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { CueCard } from "../components/common/CueCard";
import { EmptyState } from "../components/common/EmptyState";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import type { FixtureState } from "../types/FixtureState";

/** 多图层同刻命中时，按场景优先级合成每台灯最终状态。 */
function composeStates(
  stateSets: { priority: number; states: FixtureState[] }[]
): FixtureState[] {
  const perFixture = new Map<number, FixtureState & { priority: number }>();
  stateSets
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .forEach(({ priority, states }) => {
      states.forEach((state) => {
        perFixture.set(state.fixture_id, { ...state, priority });
      });
    });
  return Array.from(perFixture.values()).map(({ fixture_id, color, brightness }) => ({
    fixture_id,
    color,
    brightness
  }));
}

export function PreviewPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const loadFixtures = useFixtureStore((state) => state.load);
  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);
  const tracks = useTimelineTrackStore((state) => state.rows);
  const loadTracks = useTimelineTrackStore((state) => state.load);

  const [previewSceneId, setPreviewSceneId] = useState<number | null>(null);

  useEffect(() => {
    void loadFixtures();
    void loadScenes();
    void loadTracks();
  }, [loadFixtures, loadScenes, loadTracks]);

  const playback = useTimelinePlayback(tracks);
  const sceneMap = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, scene])),
    [scenes]
  );

  const liveStates = useMemo<FixtureState[]>(() => {
    // 静态单场景预览优先。
    if (previewSceneId !== null) {
      return sceneMap.get(previewSceneId)?.fixture_states ?? [];
    }
    const sets = playback.activeTracks
      .map((track) => sceneMap.get(track.cue_scene_id))
      .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene))
      .map((scene) => ({ priority: scene.priority, states: scene.fixture_states }));
    return composeStates(sets);
  }, [previewSceneId, sceneMap, playback.activeTracks]);

  const readyScenes = scenes.filter((scene) => scene.scene_status !== "ARCHIVED");

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>舞台预览</h2>
            <p className="muted">
              派生并保存的新场景、轨道改指向后，重新打开页面仍能在此按时间播放。
            </p>
          </div>
        </div>

        <div className="preview-layout">
          <StageCanvas fixtures={fixtures} states={liveStates} />
          <div className="preview-side">
            <div className="playback-controls">
              <button type="button" className="btn primary" onClick={playback.play} disabled={playback.playing}>
                ▶ 播放
              </button>
              <button type="button" className="btn" onClick={playback.pause} disabled={!playback.playing}>
                ⏸ 暂停
              </button>
              <button type="button" className="btn ghost" onClick={playback.stop}>
                ⏹ 回零
              </button>
            </div>
            <TimelineRuler
              durationMs={playback.durationMs}
              currentMs={playback.currentMs}
              onSeek={playback.seek}
            />
            <p className="muted">
              当前命中 {playback.activeTracks.length} 条轨道；灯光按场景优先级合成。
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>单场景静态预览</h2>
        <div className="filter-row">
          <button
            type="button"
            className={`chip${previewSceneId === null ? " active" : ""}`}
            onClick={() => setPreviewSceneId(null)}
          >
            跟随时间轴
          </button>
        </div>
        {readyScenes.length === 0 ? (
          <EmptyState title="没有可预览的场景" />
        ) : (
          <div className="card-grid">
            {readyScenes.map((scene) => (
              <CueCard
                key={scene.id}
                scene={scene}
                active={previewSceneId === scene.id}
                onClick={() =>
                  setPreviewSceneId((current) => (current === scene.id ? null : scene.id))
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
