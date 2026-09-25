import type { Fixture } from "../../types/Fixture";
import { formatFixtureType } from "../../utils/formatters";

interface FixtureIconProps {
  fixture?: Pick<Fixture, "fixture_code" | "fixture_type">;
  /** 预览灯色（rgba/hex），缺省用熄灭灰。 */
  glow?: string;
  size?: number;
}

/** 灯具图标：平面图、预览、场景列表共用。 */
export function FixtureIcon({ fixture, glow, size = 30 }: FixtureIconProps) {
  const lit = Boolean(glow);
  return (
    <span
      className="fixture-icon"
      title={
        fixture
          ? `${fixture.fixture_code} · ${formatFixtureType(fixture.fixture_type)}`
          : "缺失灯具"
      }
      style={{
        width: size,
        height: size,
        background: glow ?? "rgba(40,40,40,0.35)",
        boxShadow: lit ? `0 0 ${size / 2}px ${glow}` : "none"
      }}
    >
      {fixture ? fixture.fixture_type.slice(0, 1) : "?"}
    </span>
  );
}
