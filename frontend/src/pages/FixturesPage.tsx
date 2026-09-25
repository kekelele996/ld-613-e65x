import { useEffect } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { FixtureIcon } from "../components/common/FixtureIcon";

export function FixturesPage() {
  const fixtureStore = useFixtureStore();

  useEffect(() => {
    void fixtureStore.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">stage-light / fixtures</p>
          <h1>灯具布置</h1>
          <p className="page-desc">灯具是场景调光的引用对象；场景保存前会核对引用的灯具是否仍然存在。</p>
        </div>
      </section>

      <section className="panel">
        <h2>灯具清单（{fixtureStore.rows.length}）</h2>
        {fixtureStore.loading ? <p>加载中…</p> : (
          <div className="table fixture-grid">
            {fixtureStore.rows.map((fixture) => (
              <article key={fixture.id} className="row fixture-row">
                <FixtureIcon code={fixture.fixture_code} />
                <div>
                  <strong>{fixture.fixture_code}（#{fixture.id}）</strong>
                  <span className="cue-card-meta">
                    {fixture.fixture_type} · {fixture.color_mode} · DMX {fixture.dmx_address} · {fixture.channel_count} 通道
                  </span>
                  <span className="cue-card-meta">位置 ({fixture.position_x}, {fixture.position_y})</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
