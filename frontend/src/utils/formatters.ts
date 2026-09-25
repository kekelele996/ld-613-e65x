export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

/** 毫秒时长展示为 “x 秒 / y 毫秒” */
export const formatMs = (value: number): string =>
  value >= 1000 && value % 1000 === 0 ? `${value / 1000} 秒` : `${formatNumber(value)} 毫秒`;

/** 场景名中的序号：取末尾连续数字，如“开场 2” -> 2，“暖场备用” -> null */
export const extractSceneSequence = (name: string): number | null => {
  const matched = /(\d+)\s*$/.exec(name.trim());
  return matched ? Number(matched[1]) : null;
};

/** 判断时长字段是否为合法非负整数毫秒 */
export const isValidDuration = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;
