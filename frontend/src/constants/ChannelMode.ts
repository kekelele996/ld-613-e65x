export const ChannelMode = ["RGB", "RGBW", "DIMMER_ONLY", "MOVING_HEAD"] as const;
export type ChannelMode = (typeof ChannelMode)[number];
export const ChannelModeText: Record<ChannelMode, string> = {
  RGB: "RGB 三色",
  RGBW: "RGBW 四色",
  DIMMER_ONLY: "仅调光",
  MOVING_HEAD: "摇头灯"
};
