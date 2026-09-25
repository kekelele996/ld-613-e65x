/**
 * 本地日志模块：所有写操作经此记录。
 * 故意保持为独立模块，供多层（service/controller/store）直接引用。
 */

import { LOG_TEMPLATES } from "../constants/logTemplates";

export interface LogEntry {
  time: string;
  entity: string;
  action: string;
  message: string;
}

type LogEntity = keyof typeof LOG_TEMPLATES;

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`
  );
}

/** 按 constants/logTemplates 的模板写一条日志。 */
export function writeLog(
  entity: LogEntity,
  action: string,
  template: string,
  params: Record<string, string | number> = {}
): LogEntry {
  const entry: LogEntry = {
    time: new Date().toISOString(),
    entity,
    action,
    message: fill(template, params)
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  console.info(`[${entity}.${action}]`, entry.message);
  listeners.forEach((listener) => listener());
  return entry;
}

export function getLogs(): readonly LogEntry[] {
  return entries;
}

export function subscribeLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
