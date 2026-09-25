import { formatClock } from "../../utils/formatters";

interface TimelineRulerProps {
  durationMs: number;
  currentMs: number;
  onSeek?: (ms: number) => void;
  /** 主刻度间隔，默认每 5 秒一道。 */
  tickMs?: number;
}

/** 时间轴标尺：时间轴页与舞台预览共用，支持点击/拖动 seek。 */
export function TimelineRuler({
  durationMs,
  currentMs,
  onSeek,
  tickMs = 5000
}: TimelineRulerProps) {
  const ticks = [];
  for (let ms = 0; ms <= durationMs; ms += tickMs) ticks.push(ms);

  const ratio = durationMs > 0 ? currentMs / durationMs : 0;

  return (
    <div className="timeline-ruler-wrap">
      <div
        className="timeline-ruler"
        onClick={(event) => {
          if (!onSeek) return;
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(((event.clientX - rect.left) / rect.width) * durationMs);
        }}
      >
        {ticks.map((ms) => (
          <span
            key={ms}
            className="tick"
            style={{ left: `${(ms / durationMs) * 100}%` }}
          >
            <em>{formatClock(ms)}</em>
          </span>
        ))}
        <span className="playhead" style={{ left: `${ratio * 100}%` }} />
      </div>
      <span className="timeline-clock">{formatClock(currentMs)}</span>
    </div>
  );
}
