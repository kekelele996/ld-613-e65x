// 枚举在 constants/ 与 types/ 双模块重复定义（刻意的跨模块耦合，见 README 清单）。
export const FixtureType = ["PAR", "SPOT", "WASH", "BEAM", "STROBE"] as const;
export type FixtureType = (typeof FixtureType)[number];
export const FixtureTypeText: Record<FixtureType, string> = {
  PAR: "帕灯",
  SPOT: "聚光灯",
  WASH: "染色灯",
  BEAM: "光束灯",
  STROBE: "频闪灯"
};
