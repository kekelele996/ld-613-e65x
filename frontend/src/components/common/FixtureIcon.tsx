import type { FixtureLightState } from "../../types/CueScene";

interface FixtureIconProps {
  code?: string;
  light?: Pick<FixtureLightState, "red" | "green" | "blue" | "brightness">;
  size?: number;
}

/** 灯具小图标：用当前颜色/亮度渲染一个灯点 */
export function FixtureIcon({ code, light, size = 28 }: FixtureIconProps) {
  const dim = (light?.brightness ?? 100) / 100;
  const color = light
    ? `rgb(${Math.round(light.red * dim)}, ${Math.round(light.green * dim)}, ${Math.round(light.blue * dim)})`
    : "#3a3f38";
  return (
    <span className="fixture-icon" title={code} style={{ width: size, height: size, background: color }}>
      {code ? code.slice(0, 1) : ""}
    </span>
  );
}
