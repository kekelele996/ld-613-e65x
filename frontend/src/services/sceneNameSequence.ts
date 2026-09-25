/** 场景名称序号规则：名称形如“开场暖场 1 / 主唱追光-2 / 慢歌蓝调_3”，末尾数字即序号。 */

export interface ParsedSceneName {
  base: string;
  /** 名称与序号之间的连接字符（空格/连字符/下划线），展示时统一补一个空格。 */
  sequence: number | null;
}

export function parseSceneName(name: string): ParsedSceneName {
  const trimmed = name.trim();
  const match = /^(.*?)([\s_\-]*)(\d+)$/.exec(trimmed);
  if (!match) return { base: trimmed, sequence: null };
  return { base: match[1].trim(), sequence: Number(match[3]) };
}

export function buildSceneName(base: string, sequence: number): string {
  return `${base.trim()} ${sequence}`;
}

/** 同基名 + 同序号视为同一序号占用（忽略连接符与多余空白差异）。 */
export function isSameSequence(
  name: string,
  base: string,
  sequence: number
): boolean {
  const parsed = parseSceneName(name);
  return parsed.sequence === sequence && parsed.base === base;
}

/**
 * 补一个未占用序号：从 1 起找第一个未被占用的数字。
 * 被删除/不存在的空号会被优先重新补齐。
 */
export function nextUnoccupiedSequence(
  base: string,
  occupiedNames: string[]
): number {
  const occupied = new Set(
    occupiedNames
      .map((name) => parseSceneName(name))
      .filter((parsed) => parsed.base === base && parsed.sequence !== null)
      .map((parsed) => parsed.sequence as number)
  );
  let sequence = 1;
  while (occupied.has(sequence)) sequence += 1;
  return sequence;
}
