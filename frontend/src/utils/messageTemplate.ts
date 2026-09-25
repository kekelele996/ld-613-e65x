import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { ErrorCode } from "../constants/errorCodes";

/** 用 params 填充 constants/errorMessages 中的 {占位符} */
export function renderMessage(code: ErrorCode, params: Record<string, string | number> = {}): string {
  const template = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.VALIDATION_FAILED;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}
