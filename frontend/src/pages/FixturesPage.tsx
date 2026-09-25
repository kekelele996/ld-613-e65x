import { useEffect, useMemo, useState } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { StageCanvas } from "../components/common/StageCanvas";
import { EmptyState } from "../components/common/EmptyState";
import { useDmxAddressCheck } from "../hooks/useDmxAddressCheck";
import { formatChannelMode, formatFixtureType } from "../utils/formatters";
import { FixtureType } from "../constants/FixtureType";
import { ChannelMode } from "../constants/ChannelMode";

export function FixturesPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const loadFixtures = useFixtureStore((state) => state.load);
  const remove = useFixtureStore((state) => state.remove);
  const scenes = useCueSceneStore((state) => state.rows);
  const loadScenes = useCueSceneStore((state) => state.load);

  const [message, setMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");

  useEffect(() => {
    void loadFixtures();
    void loadScenes();
  }, [loadFixtures, loadScenes]);

  const { conflicts, hasConflict, suggestedAddress } = useDmxAddressCheck(fixtures);

  // FixtureType / ChannelMode 双枚举筛选：常量文件被页面筛选器直接引用。
  const visibleFixtures = useMemo(
    () =>
      fixtures.filter(
        (fixture) =>
          (typeFilter === "ALL" || fixture.fixture_type === typeFilter) &&
          (modeFilter === "ALL" || fixture.color_mode === modeFilter)
      ),
    [fixtures, typeFilter, modeFilter]
  );

  /** 被场景引用的灯具删除前给出提示（删除保留失效引用，保存草稿时会被拦下）。 */
  const referenceCount = (fixtureId: number) =>
    scenes.filter((scene) =>
      scene.fixture_states.some((state) => state.fixture_id === fixtureId)
    ).length;

  const handleDelete = async (id: number, code: string, refs: number) => {
    const confirmText =
      refs > 0
        ? `灯具 ${code} 被 ${refs} 个场景引用。删除后引用会保留为“缺失灯具”，相关草稿保存时会被拦下。仍要删除？`
        : `确认删除灯具 ${code}？`;
    if (!window.confirm(confirmText)) return;
    await remove(id);
    setMessage(`灯具 ${code} 已删除${refs > 0 ? "，相关场景保留了失效引用，可去场景编辑验证保存拦截。" : "。"}`);
    window.setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-toolbar">
          <div>
            <h2>灯具平面图</h2>
            <p className="muted">
              共 {fixtures.length} 台灯；建议下一空闲 DMX 起始地址 {suggestedAddress}。
              删除被引用灯具可复现“引用缺失灯具”保存拦截。
            </p>
          </div>
        </div>
        {hasConflict ? (
          <div className="alert warn">
            检测到 DMX 通道冲突：
            {conflicts
              .map(
                ({ address, fixtures: rows }) =>
                  `地址 ${address} ← ${rows.map((row) => row.fixture_code).join("/")}`
              )
              .join("；")}
          </div>
        ) : (
          <div className="alert ok">DMX 通道区间无冲突。</div>
        )}
        {message ? <div className="alert info">{message}</div> : null}
        <div className="filter-row" aria-label="灯具类型筛选">
          <button
            type="button"
            className={`chip${typeFilter === "ALL" ? " active" : ""}`}
            onClick={() => setTypeFilter("ALL")}
          >
            全部类型
          </button>
          {FixtureType.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip${typeFilter === value ? " active" : ""}`}
              onClick={() => setTypeFilter(value)}
            >
              {formatFixtureType(value)}
            </button>
          ))}
        </div>
        <div className="filter-row" aria-label="通道模式筛选">
          <button
            type="button"
            className={`chip${modeFilter === "ALL" ? " active" : ""}`}
            onClick={() => setModeFilter("ALL")}
          >
            全部通道
          </button>
          {ChannelMode.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip${modeFilter === value ? " active" : ""}`}
              onClick={() => setModeFilter(value)}
            >
              {formatChannelMode(value)}
            </button>
          ))}
        </div>
        <StageCanvas fixtures={visibleFixtures} states={[]} />
      </section>

      <section className="panel">
        <h2>灯具清单</h2>
        {visibleFixtures.length === 0 ? (
          <EmptyState title="该筛选下暂无灯具" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>类型</th>
                <th>通道模式</th>
                <th>DMX 地址</th>
                <th>通道数</th>
                <th>舞台坐标</th>
                <th>场景引用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleFixtures.map((fixture) => {
                const refs = referenceCount(fixture.id);
                return (
                  <tr key={fixture.id}>
                    <td>{fixture.fixture_code}</td>
                    <td>{formatFixtureType(fixture.fixture_type)}</td>
                    <td>{formatChannelMode(fixture.color_mode)}</td>
                    <td>{fixture.dmx_address}</td>
                    <td>{fixture.channel_count}</td>
                    <td>
                      ({fixture.position_x}, {fixture.position_y})
                    </td>
                    <td>{refs > 0 ? `${refs} 个场景` : "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost mini danger"
                        onClick={() => void handleDelete(fixture.id, fixture.fixture_code, refs)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
