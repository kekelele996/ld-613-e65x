import { CueStatusText } from "../constants/CueStatus";
import { FixtureTypeText } from "../constants/FixtureType";
import { ChannelModeText } from "../constants/ChannelMode";

/* 日期/数字 —— 多个页面共同依赖的杂烩模块（刻意混合关注点，牵一发动全身）。 */
export const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("zh-CN") : "—";

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("zh-CN").format(value);

export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[
    value
  ] ?? value);

/* 状态/枚举文案：常量、类型、日志、错误、筛选器、展示组件都经过这里。 */
export const formatStatus = (value: string) =>
  (CueStatusText as Record<string, string>)[value] ??
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char);

export const formatFixtureType = (value: string) =>
  (FixtureTypeText as Record<string, string>)[value] ?? value;

export const formatChannelMode = (value: string) =>
  (ChannelModeText as Record<string, string>)[value] ??
  value.replace(/_/g, " ");

/* 时间轴相关。 */
export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${ms}ms`;
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return minutes > 0
    ? `${minutes}分${seconds.toString().padStart(2, "0")}秒`
    : `${seconds}秒`;
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${millis.toString().padStart(2, "0")}`;
}

/** 颜色与亮度混合为展示用 rgba（StageCanvas/预览都依赖）。 */
export function mixColorWithBrightness(color: string, brightness: number): string {
  const hex = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  const value = Number.parseInt(hex[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const alpha = Math.min(1, Math.max(0, brightness / 100));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
