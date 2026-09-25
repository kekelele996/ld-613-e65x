import type { CueScene } from "../../types/CueScene";
import { formatMs } from "../../utils/formatters";
import { StatusBadge } from "./StatusBadge";

interface CueCardProps {
  scene: CueScene;
  fixtureCount?: number;
  occupiedBy?: Array<{ id: number; layer: number }>;
  action?: React.ReactNode;
}

/** 场景卡片：展示名称、状态、灯具数、渐变/保持时长、优先级，以及归档占用提示 */
export function CueCard({ scene, fixtureCount, occupiedBy, action }: CueCardProps) {
  const inUse = (occupiedBy?.length ?? 0) > 0;
  return (
    <article className={`cue-card ${scene.scene_status === "ARCHIVED" ? "archived" : ""}`}>
      <header className="cue-card-head">
        <div>
          <strong className="cue-card-title">{scene.name}</strong>
          <span className="cue-card-meta">#{scene.id} · {fixtureCount ?? scene.fixture_states.length} 台灯 · 优先级 {scene.priority}</span>
        </div>
        <StatusBadge value={scene.scene_status} />
      </header>
      <p className="cue-card-times">
        淡入 {formatMs(scene.fade_in_ms)} · 保持 {formatMs(scene.hold_ms)}
      </p>
      {inUse ? (
        <p className="occupancy-hint">
          被 {occupiedBy!.length} 条轨道引用：{occupiedBy!.map((track) => `#${track.id}(图层${track.layer})`).join("、")}
        </p>
      ) : null}
      {action ? <footer className="cue-card-actions">{action}</footer> : null}
    </article>
  );
}
