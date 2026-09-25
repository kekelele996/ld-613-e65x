import { ColorChannelSlider } from "../common/ColorChannelSlider";
import { FixtureIcon } from "../common/FixtureIcon";
import type { Fixture } from "../../types/Fixture";
import type { CueSceneDraft, CueSceneIssue, FixtureLightState } from "../../types/CueScene";

interface SceneDraftEditorProps {
  draft: CueSceneDraft;
  fixtures: Fixture[];
  issues: CueSceneIssue[];
  onChange: (draft: CueSceneDraft) => void;
}

/** 草稿编辑：逐灯调颜色与亮度，并维护名称、渐变/保持时长与优先级 */
export function SceneDraftEditor({ draft, fixtures, issues, onChange }: SceneDraftEditorProps) {
  const invalidFields = new Set(issues.map((issue) => issue.field).filter(Boolean) as string[]);
  const missingFixtureIds = new Set(
    issues.filter((issue) => issue.code === "SCENE_FIXTURE_MISSING").map((issue) => issue.fixture_id!)
  );
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  const patch = (partial: Partial<CueSceneDraft>) => onChange({ ...draft, ...partial });

  const patchState = (fixtureId: number, partial: Partial<FixtureLightState>) => {
    patch({
      fixture_states: draft.fixture_states.map((state) =>
        state.fixture_id === fixtureId ? { ...state, ...partial } : state
      )
    });
  };

  const removeState = (fixtureId: number) => {
    patch({ fixture_states: draft.fixture_states.filter((state) => state.fixture_id !== fixtureId) });
  };

  const addFixture = (fixtureId: number) => {
    if (!fixtureId || draft.fixture_states.some((state) => state.fixture_id === fixtureId)) return;
    patch({
      fixture_states: [...draft.fixture_states, { fixture_id: fixtureId, red: 255, green: 255, blue: 255, brightness: 80 }]
    });
  };

  const availableFixtures = fixtures.filter(
    (fixture) => !draft.fixture_states.some((state) => state.fixture_id === fixture.id)
  );

  return (
    <div className="draft-editor">
      <label className="field">
        <span>场景名称（末尾数字作为序号）</span>
        <input
          className={invalidFields.has("name") ? "input-invalid" : ""}
          value={draft.name}
          onChange={(event) => patch({ name: event.target.value })}
          placeholder="例如：开场 5"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>淡入时间（毫秒）</span>
          <input
            type="number"
            min={0}
            step={1}
            className={invalidFields.has("fade_in_ms") ? "input-invalid" : ""}
            value={Number.isFinite(draft.fade_in_ms) ? draft.fade_in_ms : ""}
            onChange={(event) => patch({ fade_in_ms: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>保持时间（毫秒）</span>
          <input
            type="number"
            min={0}
            step={1}
            className={invalidFields.has("hold_ms") ? "input-invalid" : ""}
            value={Number.isFinite(draft.hold_ms) ? draft.hold_ms : ""}
            onChange={(event) => patch({ hold_ms: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>优先级（数字越大越优先）</span>
          <input
            type="number"
            step={1}
            value={draft.priority}
            onChange={(event) => patch({ priority: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="state-list">
        <h3>逐灯调光（{draft.fixture_states.length} 台）</h3>
        {draft.fixture_states.map((state) => {
          const fixture = fixtureMap.get(state.fixture_id);
          const missing = missingFixtureIds.has(state.fixture_id);
          return (
            <section key={state.fixture_id} className={`state-row ${missing ? "missing" : ""}`}>
              <header>
                <FixtureIcon code={fixture?.fixture_code ?? `#${state.fixture_id}`} light={state} />
                <div>
                  <strong>{fixture ? `${fixture.fixture_code}（#${fixture.id}）` : `缺失灯具 #${state.fixture_id}`}</strong>
                  {fixture ? <span className="state-sub">{fixture.fixture_type} · {fixture.color_mode}</span> : null}
                </div>
                <button type="button" className="btn-ghost" onClick={() => removeState(state.fixture_id)}>移除</button>
              </header>
              {missing ? <p className="row-error">该灯具已不存在，保存会被拦下；请移除该灯或恢复灯具。</p> : null}
              <div className="slider-grid">
                <ColorChannelSlider label="红 R" max={255} value={state.red} onChange={(red) => patchState(state.fixture_id, { red })} />
                <ColorChannelSlider label="绿 G" max={255} value={state.green} onChange={(green) => patchState(state.fixture_id, { green })} />
                <ColorChannelSlider label="蓝 B" max={255} value={state.blue} onChange={(blue) => patchState(state.fixture_id, { blue })} />
                <ColorChannelSlider label="亮度" max={100} value={state.brightness} onChange={(brightness) => patchState(state.fixture_id, { brightness })} />
              </div>
            </section>
          );
        })}
        {draft.fixture_states.length === 0 ? <p className="empty-hint">还没有灯具，先从下方加入一台。</p> : null}
        {availableFixtures.length > 0 ? (
          <label className="field add-fixture">
            <span>加入灯具</span>
            <select value="" onChange={(event) => addFixture(Number(event.target.value))}>
              <option value="">选择灯具…</option>
              {availableFixtures.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixture.fixture_code}（#{fixture.id}）
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
