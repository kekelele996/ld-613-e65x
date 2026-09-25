import { STORES, nextId, putRow } from "../db";
import type { OperationLog } from "../types/OperationLog";

/** 所有写操作统一走这里落审计日志到 IndexedDB */
export async function writeLog(
  entity: OperationLog["entity"],
  action: string,
  detail: string
): Promise<void> {
  const log: OperationLog = {
    id: await nextId(STORES.operationLog),
    entity,
    action,
    detail,
    created_at: new Date().toISOString()
  };
  await putRow(STORES.operationLog, log);
  console.info(`[${entity}] ${action} ${detail}`);
}
