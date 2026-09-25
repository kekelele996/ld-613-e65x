import { formatStatus } from "../../utils/formatters";

const TONE: Record<string, string> = {
  DRAFT: "draft",
  READY: "ready",
  DISABLED: "disabled",
  ARCHIVED: "archived",
  LOCAL_DATA: "ready"
};

export function StatusBadge({ value }: { value: string }) {
  const tone = TONE[value] ?? "draft";
  return (
    <span className={`badge ${tone}`} title={value}>
      {formatStatus(value)}
    </span>
  );
}
