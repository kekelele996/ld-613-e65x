import { useEffect, useMemo, useState } from "react";
import type { CueScene } from "../../types/CueScene";
import type { Fixture } from "../../types/Fixture";
import type { FixtureState } from "../../types/FixtureState";
import { ColorChannelSlider } from "../common/ColorChannelSlider";
import { FixtureIcon } from "../common/FixtureIcon";
import { EmptyState } from "../common/EmptyState";
import { mixColorWithBrightness } from "../../utils/formatters";

export interface SceneDraftEditorProps {
  draft: CueScene;
  fixtures: Fixture[];
  saving: boolean;
  errorMessage: string | null;
  onChange: (next: CueScene) => void;
  onSave: () => void;
  onCancelSelect: () => void;
}

/** 逐灯调整颜色/亮度、名称序号与渐变时间的草稿编辑器。 */
export function SceneDraftEditor({
  draft,
  fixtures,
  saving,
  errorMessage,
  onChange,
  onSave,
  onCancelSelect
}: SceneDraftEditorProps) {
  const fixtureMap = useMemo(
    () => new Map(fixtures.map((fixture) => [fixture.id, fixture])),
    [fixtures]
  );

  const [addId, setAddId] = useState<string>("");
  useEffect(() => setAddId(""), [draft.id]);

  const missingStates = draft.fixture_states.filter(
    (state) => !fixtureMap.has(state.fixture_id)
  );

  const patch = (partial: Partial<CueScene>) => onChange({ ...draft, ...partial });

  const patchState = (fixtureId: number, partial: Partial<FixtureState>) =>
    patch({
      fixture_states: draft.fixture_states.map((state) =>
        state.fixture_id === fixtureId ? { ...state, ...partial } : state
      )
    });

  const removeState = (fixtureId: number) =>
    patch({
      fixture_states: draft.fixture_states.filter(
        (state) => state.fixture_id !== fixtureId
      )
    });

  const addState = () => {
    const fixtureId = Number(addId);
    if (!fixtureId || !fixtureMap.has(fixtureId)) return;
    if (draft.fixture_states.some((state) => state.fixture_id === fixtureId)) return;
    patch({
      fixture_states: [
        ...draft.fixture_states,
        { fixture_id: fixtureId, color: "#ffaa33", brightness: 60 }
      ]
    });
    setAddId("");
  };

  const includedIds = new Set(draft.fixture_states.map((state) => state.fixture_id));
  const availableFixtures = fixtures.filter(
    (fixture) => !includedIds.has(fixture.id)
  );

  return (
    <div className="panel editor">
      <div className="editor-head">
        <div>
          <h2>草稿编辑 · {draft.name}</h2>
          <p className="muted">
            {draft.derived_from_id
              ? `由场景 #${draft.derived_from_id} 派生，原场景不会被修改`
              : "手工新建草稿"}
          </p>
        </div>
        <div className="editor-actions">
          <button type="button" className="btn ghost" onClick={onCancelSelect}>
            收起
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "保存中…" : "校验并保存"}
          </button>
        </div>
      </div>

      {errorMessage ? <div className="alert error">{errorMessage}</div> : null}
      {missingStates.length > 0 ? (
        <div className="alert warn">
          {`草稿引用了 ${missingStates.length} 台已缺失灯具（${missingStates
            .map((state) => `#${state.fixture_id}`)
            .join("、")}），保存会被拦下，可在此逐台移除。`}
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          场景名称（末尾需带序号）
          <input
            data-testid="draft-name"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </label>
        <label>
          优先级
          <input
            data-testid="draft-priority"
            type="number"
            min={1}
            max={99}
            value={draft.priority}
            onChange={(event) => patch({ priority: Number(event.target.value) })}
          />
        </label>
        <label>
          渐变时间 fade_in（毫秒）
          <input
            data-testid="draft-fade-in"
            type="number"
            min={0}
            value={draft.fade_in_ms}
            onChange={(event) =>
              patch({ fade_in_ms: Number(event.target.value) })
            }
          />
        </label>
        <label>
          保持时间 hold（毫秒）
          <input
            data-testid="draft-hold"
            type="number"
            min={0}
            value={draft.hold_ms}
            onChange={(event) => patch({ hold_ms: Number(event.target.value) })}
          />
        </label>
      </div>

      <h3>逐灯颜色与亮度</h3>
      {draft.fixture_states.length === 0 ? (
        <EmptyState title="草稿中还没有灯具" hint="从下方选择灯具加入后逐台调光。" />
      ) : (
        <ul className="fixture-state-list">
          {draft.fixture_states.map((state) => {
            const fixture = fixtureMap.get(state.fixture_id);
            return (
              <li
                key={state.fixture_id}
                className={fixture ? "" : "missing"}
              >
                <div className="fixture-state-head">
                  <FixtureIcon
                    fixture={fixture}
                    glow={mixColorWithBrightness(state.color, state.brightness)}
                  />
                  <div>
                    <strong>
                      {fixture
                        ? `${fixture.fixture_code}（${fixture.fixture_type}）`
                        : `缺失灯具 #${state.fixture_id}`}
                    </strong>
                    <span className="muted">
                      {fixture
                        ? `DMX ${fixture.dmx_address} · ${fixture.color_mode}`
                        : "灯具已被删除，引用仍保留在草稿里"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => removeState(state.fixture_id)}
                  >
                    移除
                  </button>
                </div>
                <ColorChannelSlider
                  label={fixture ? fixture.fixture_code : `#${state.fixture_id}`}
                  color={state.color}
                  brightness={state.brightness}
                  onColorChange={(color) => patchState(state.fixture_id, { color })}
                  onBrightnessChange={(brightness) =>
                    patchState(state.fixture_id, { brightness })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {availableFixtures.length > 0 ? (
        <div className="add-fixture-row">
          <select value={addId} onChange={(event) => setAddId(event.target.value)}>
            <option value="">加入已有灯具…</option>
            {availableFixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.fixture_code}（{fixture.fixture_type}）
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={addState} disabled={!addId}>
            加入草稿
          </button>
        </div>
      ) : null}
    </div>
  );
}
