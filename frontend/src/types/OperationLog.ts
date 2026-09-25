/** 写操作审计日志，结构对应 constants/logTemplates 中的模板键 */
export interface OperationLog {
  id: number;
  entity: "Fixture" | "CueScene" | "TimelineTrack" | "ShowProject";
  action: string;
  detail: string;
  created_at: string;
}
