/** 本地自增 id 工具，IndexedDB 种子数据之外的新记录统一由此取号。 */
export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
