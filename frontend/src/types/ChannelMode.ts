// 枚举在 constants/ 与 types/ 双模块重复定义（刻意的跨模块耦合，见 README 清单）。
export const ChannelMode = ["RGB", "RGBW", "DIMMER_ONLY", "MOVING_HEAD"] as const;
export type ChannelMode = (typeof ChannelMode)[number];
export const ChannelModeText: Record<ChannelMode, string> = {
  RGB: "RGB 三色",
  RGBW: "RGBW 四色",
  DIMMER_ONLY: "仅调光",
  MOVING_HEAD: "摇头灯"
};
