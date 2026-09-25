import { useEffect, useMemo, useState } from "react";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import type { CueScene } from "../types/CueScene";
import { CueCard } from "../components/common/CueCard";
import { EmptyState } from "../components/common/EmptyState";
import { SceneDraftEditor } from "../components/cues/SceneDraftEditor";
import { ArchiveSceneButton } from "../components/cues/ArchiveSceneButton";
import { StageLightError } from "../errors/StageLightError";

type StatusFilter = "ALL" | "DRAFT" | "READY" | "DISABLED" | "ARCHIVED";

const FILTERS: StatusFilter[] = ["ALL", "DRAFT", "READY", "DISABLED", "ARCHIVED"];

export function CuesPage() {
  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);
  const derive = useCueSceneStore((state) => state.derive);
  const createDraft = useCueSceneStore((state) => state.createDraft);
  const saveDraft = useCueSceneStore((state) => state.saveDraft);
  const archive = useCueSceneStore((state) => state.archive);

  const fixtures = useFixtureStore((state) => state.rows);
  const loadFixtures = useFixtureStore((state) => state.load);
  const tracks = useTimelineTrackStore((state) => state.rows);
  const loadTracks = useTimelineTrackStore((state) => state.load);

  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftCopy, setDraftCopy] = useState<CueScene | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadScenes();
    void loadFixtures();
    void loadTracks();
  }, [loadScenes, loadFixtures, loadTracks]);

  // 派生/新建后立即进入编辑；重新打开页面后仍能看到已保存草稿。
  useEffect(() => {
    if (editingId === null) return;
    const scene = scenes.find((row) => row.id === editingId);
    if (!scene) {
      setEditingId(null);
      setDraftCopy(null);
      return;
    }
    setDraftCopy((current) =>
      current && current.id === editingId ? current : { ...scene }
    );
  }, [editingId, scenes]);

  const visibleScenes = useMemo(
    () =>
      filter === "ALL"
        ? scenes
        : scenes.filter((scene) => scene.scene_status === filter),
    [scenes, filter]
  );

  const editingScene = editingId === null ? null : scenes.find((s) => s.id === editingId) ?? null;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const handleDerive = async (sourceId: number) => {
    setErrorMessage(null);
    try {
      const draft = await derive(sourceId);
      setEditingId(draft.id);
      setDraftCopy({ ...draft });
      flash(`已从源场景派生草稿“${draft.name}”，灯具状态/渐变时间/优先级已带入。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "派生失败");
    }
  };

  const handleCreate = async () => {
    setErrorMessage(null);
    const draft = await createDraft();
    setEditingId(draft.id);
    setDraftCopy({ ...draft });
  };

  const handleSave = async () => {
    if (!draftCopy) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await saveDraft(draftCopy, fixtures);
      flash(`草稿“${draftCopy.name}”校验通过，已保存为就绪场景。`);
      setEditingId(null);
      setDraftCopy(null);
      // 重新拉取，确保“重新打开页面”视角下数据一致。
      await loadScenes();
    } catch (error) {
      if (error instanceof StageLightError) {
        setErrorMessage(`保存已停下：${error.message}`);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    setErrorMessage(null);
    try {
      await archive(id, tracks);
      flash("场景已归档。");
    } catch (error) {
      if (error instanceof StageLightError) {
        setErrorMessage(`归档被拦下：${error.message}`);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "归档失败");
      }
    }
  };

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>场景列表</h2>
            <p className="muted">
              从调好的场景“派生草稿”做巡演手工重排：带入灯具状态、渐变时间和优先级，名称自动补未占用序号。
            </p>
          </div>
          <button type="button" className="btn" onClick={handleCreate}>
            ＋ 空白草稿
          </button>
        </div>
        <div className="filter-row" role="tablist" aria-label="状态筛选">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip${filter === value ? " active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {value === "ALL" ? "全部" : value}
            </button>
          ))}
        </div>

        {notice ? <div className="alert ok">{notice}</div> : null}
        {errorMessage ? <div className="alert error">{errorMessage}</div> : null}

        {visibleScenes.length === 0 ? (
          <EmptyState title="该筛选下暂无场景" hint="试试“全部”，或新建一个空白草稿。" />
        ) : (
          <div className="card-grid">
            {visibleScenes.map((scene) => (
              <CueCard
                key={scene.id}
                scene={scene}
                active={editingId === scene.id}
                footnote={
                  scene.derived_from_id
                    ? `派生自场景 #${scene.derived_from_id}`
                    : undefined
                }
                onClick={
                  scene.scene_status === "DRAFT"
                    ? () => {
                        setErrorMessage(null);
                        setEditingId(scene.id);
                        setDraftCopy({ ...scene });
                      }
                    : undefined
                }
              >
                <div className="card-actions">
                  {scene.scene_status === "DRAFT" ? (
                    <button
                      type="button"
                      className="btn mini primary"
                      onClick={() => {
                        setEditingId(scene.id);
                        setDraftCopy({ ...scene });
                      }}
                    >
                      继续编辑
                    </button>
                  ) : null}
                  {scene.scene_status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      className="btn mini"
                      onClick={() => void handleDerive(scene.id)}
                    >
                      派生草稿
                    </button>
                  ) : null}
                  <ArchiveSceneButton
                    scene={scene}
                    tracks={tracks}
                    onArchive={handleArchive}
                  />
                </div>
                {editingId === scene.id ? null : null}
              </CueCard>
            ))}
          </div>
        )}
      </div>

      {draftCopy && editingScene ? (
        <SceneDraftEditor
          draft={draftCopy}
          fixtures={fixtures}
          saving={saving}
          errorMessage={errorMessage}
          onChange={(next) => setDraftCopy(next)}
          onSave={() => void handleSave()}
          onCancelSelect={() => {
            setEditingId(null);
            setDraftCopy(null);
          }}
        />
      ) : null}
    </div>
  );
}
