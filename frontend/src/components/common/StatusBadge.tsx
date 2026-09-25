const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  READY: "就绪",
  DISABLED: "停用",
  ARCHIVED: "已归档",
  LOCAL_DATA: "本地数据"
};

export function StatusBadge({ value }: { value: string }) {
  const key = String(value);
  return <span className={"badge " + key.toLowerCase().replace(/_/g, "-")}>{STATUS_LABELS[key] ?? key.replace(/_/g, " ")}</span>;
}
