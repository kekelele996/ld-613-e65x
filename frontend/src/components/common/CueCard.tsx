import type { CueScene } from "../../types/CueScene";
import { StatusBadge } from "./StatusBadge";
import { formatMs, formatNumber } from "../../utils/formatters";

interface CueCardProps {
  scene: CueScene;
  active?: boolean;
  footnote?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

/** 场景卡片：场景列表、时间轴块、预览侧栏共用。 */
export function CueCard({ scene, active, footnote, onClick, children }: CueCardProps) {
  return (
    <article
      className={
        onClick ? `cue-card selectable${active ? " active" : ""}` : "cue-card"
      }
      onClick={onClick}
    >
      <div className="cue-card-head">
        <strong title={scene.name}>{scene.name}</strong>
        <StatusBadge value={scene.scene_status} />
      </div>
      <div className="cue-card-meta">
        <span>{formatNumber(scene.fixture_states.length)} 台灯</span>
        <span>淡入 {formatMs(scene.fade_in_ms)}</span>
        <span>保持 {formatMs(scene.hold_ms)}</span>
        <span>优先级 {scene.priority}</span>
      </div>
      {footnote ? <p className="cue-card-foot">{footnote}</p> : null}
      {children}
    </article>
  );
}
