import { useEffect, useMemo, useState } from "react";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { validateSceneDraftController } from "../controllers/CueSceneController";
import { ServiceError } from "../utils/errors";
import type { CueSceneDraft, CueSceneIssue } from "../types/CueScene";
import { CueCard } from "../components/common/CueCard";
import { IssueBanner } from "../components/cues/IssueBanner";
import { SceneDraftEditor } from "../components/cues/SceneDraftEditor";

export function CuesPage() {
  const sceneStore = useCueSceneStore();
  const fixtureStore = useFixtureStore();
  const trackStore = useTimelineTrackStore();

  const [draft, setDraft] = useState<CueSceneDraft | null>(null);
  const [issues, setIssues] = useState<CueSceneIssue[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void sceneStore.load();
    void fixtureStore.load();
    void trackStore.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const occupancy = useMemo(() => {
    const map = new Map<number, Array<{ id: number; layer: number }>>();
    for (const track of trackStore.rows) {
      const list = map.get(track.cue_scene_id) ?? [];
      list.push({ id: track.id, layer: track.layer });
      map.set(track.cue_scene_id, list);
    }
    return map;
  }, [trackStore.rows]);

  const startDerive = async (sourceId: number) => {
    setBusy(true);
    setActionError(null);
    setIssues([]);
    try {
      const nextDraft = await sceneStore.deriveDraft(sourceId);
      setDraft(nextDraft);
      setIssues(await validateSceneDraftController(nextDraft));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "派生草稿失败");
    } finally {
      setBusy(false);
    }
  };

  const handleDraftChange = async (nextDraft: CueSceneDraft) => {
    setDraft(nextDraft);
    setIssues(await validateSceneDraftController(nextDraft));
  };

  const handleSave = async () => {
    if (!draft) return;
    setBusy(true);
    setActionError(null);
    const latestIssues = await validateSceneDraftController(draft);
    setIssues(latestIssues);
    if (latestIssues.length > 0) {
      setBusy(false);
      return;
    }
    try {
      await sceneStore.saveDraft(draft);
      setDraft(null);
      setIssues([]);
    } catch (error) {
      setActionError(error instanceof ServiceError ? error.message : "保存失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (sceneId: number) => {
    setActionError(null);
    try {
      await sceneStore.archive(sceneId);
    } catch (error) {
      setActionError(error instanceof ServiceError ? error.message : "归档失败");
    }
  };

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">stage-light / cues</p>
          <h1>场景编辑</h1>
          <p className="page-desc">从调好的场景派生草稿：灯具状态、渐变时间和优先级一并带出，名称自动补未占用序号，原场景保持不变。</p>
        </div>
      </section>

      {actionError ? <div className="action-error" role="alert">{actionError}</div> : null}

      {draft ? (
        <section className="panel draft-panel">
          <div className="panel-head">
            <h2>草稿编辑（保存前不会影响原场景）</h2>
            <button type="button" className="btn-ghost" onClick={() => { setDraft(null); setIssues([]); }}>
              放弃草稿
            </button>
          </div>
          <IssueBanner issues={issues} />
          <SceneDraftEditor draft={draft} fixtures={fixtureStore.rows} issues={issues} onChange={handleDraftChange} />
          <footer className="draft-footer">
            <button type="button" className="btn-primary" disabled={busy || issues.length > 0} onClick={handleSave}>
              保存场景
            </button>
            {issues.length > 0 ? <span className="save-hint">存在 {issues.length} 个问题，修正后才能保存</span> : null}
          </footer>
        </section>
      ) : null}

      <section className="panel">
        <h2>已有场景（{sceneStore.rows.length}）</h2>
        {sceneStore.loading ? <p>加载中…</p> : (
          <div className="cue-grid">
            {sceneStore.rows.map((scene) => {
              const occupiedBy = occupancy.get(scene.id) ?? [];
              const archived = scene.scene_status === "ARCHIVED";
              return (
                <CueCard
                  key={scene.id}
                  scene={scene}
                  occupiedBy={archived ? undefined : occupiedBy}
                  action={
                    <>
                      <button type="button" className="btn-secondary" disabled={busy || archived} onClick={() => startDerive(scene.id)}>
                        派生草稿
                      </button>
                      {archived ? (
                        <span className="archive-note">已归档</span>
                      ) : occupiedBy.length > 0 ? (
                        <button
                          type="button"
                          className="btn-ghost"
                          title={`仍有 ${occupiedBy.length} 条轨道引用：${occupiedBy.map((track) => `#${track.id}(图层${track.layer})`).join("、")}；请到时间轴把轨道改指向新场景`}
                          disabled
                        >
                          归档不可用（{occupiedBy.length} 条轨道占用）
                        </button>
                      ) : (
                        <button type="button" className="btn-ghost" disabled={busy} onClick={() => handleArchive(scene.id)}>
                          归档
                        </button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
        <p className="foot-hint">提示：序号取场景名末尾数字；派生时会自动跳过已占用序号。</p>
      </section>
    </main>
  );
}
