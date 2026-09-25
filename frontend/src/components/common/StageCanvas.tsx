import type { Fixture } from "../../types/Fixture";
import type { FixtureState } from "../../types/FixtureState";
import { FixtureIcon } from "./FixtureIcon";
import { mixColorWithBrightness } from "../../utils/formatters";

interface StageCanvasProps {
  fixtures: Fixture[];
  /** 当前要呈现的灯具状态（某一场景或播放合成结果）；缺失灯具会被跳过。 */
  states: FixtureState[];
  width?: number;
  height?: number;
  selectedId?: number | null;
  onSelectFixture?: (id: number) => void;
}

/** 二维舞台画布：灯具布置页与舞台预览页共用。 */
export function StageCanvas({
  fixtures,
  states,
  width = 600,
  height = 380,
  selectedId,
  onSelectFixture
}: StageCanvasProps) {
  const stateMap = new Map(states.map((state) => [state.fixture_id, state]));

  return (
    <div className="stage-canvas" style={{ width, height }}>
      <div className="stage-screen" />
      {fixtures.map((fixture) => {
        const state = stateMap.get(fixture.id);
        const glow = state
          ? mixColorWithBrightness(state.color, state.brightness)
          : undefined;
        return (
          <button
            type="button"
            key={fixture.id}
            className={`stage-fixture${selectedId === fixture.id ? " selected" : ""}`}
            style={{ left: fixture.position_x, top: fixture.position_y }}
            disabled={!onSelectFixture}
            onClick={() => onSelectFixture?.(fixture.id)}
            title={fixture.fixture_code}
          >
            <FixtureIcon fixture={fixture} glow={glow} />
            <span className="stage-fixture-code">{fixture.fixture_code}</span>
          </button>
        );
      })}
    </div>
  );
}
