import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { ErrorCode } from "../constants/errorCodes";

/** service/controller 分层抛出的业务异常，携带错误码与可展示文案。 */
export class StageLightError extends Error {
  readonly code: ErrorCode;
  readonly detail: Record<string, string | number>;

  constructor(code: ErrorCode, detail: Record<string, string | number> = {}) {
    super(renderErrorMessage(code, detail));
    this.name = "StageLightError";
    this.code = code;
    this.detail = detail;
  }
}

/** 按 constants/errorMessages 模板渲染错误文案，{token} 占位符替换。 */
export function renderErrorMessage(
  code: ErrorCode,
  detail: Record<string, string | number> = {}
): string {
  const template = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.VALIDATION_FAILED;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in detail ? String(detail[key]) : `{${key}}`
  );
}
