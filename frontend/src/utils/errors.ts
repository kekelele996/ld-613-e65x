import type { ErrorCode } from "../constants/errorCodes";

/** service / controller 分层包装异常时使用的统一错误对象 */
export class ServiceError extends Error {
  code: ErrorCode;
  params: Record<string, string | number>;

  constructor(code: ErrorCode, message: string, params: Record<string, string | number> = {}) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.params = params;
  }
}

export class ControllerError extends Error {
  code: ErrorCode;
  causeError?: unknown;

  constructor(code: ErrorCode, message: string, causeError?: unknown) {
    super(message);
    this.name = "ControllerError";
    this.code = code;
    this.causeError = causeError;
  }
}
