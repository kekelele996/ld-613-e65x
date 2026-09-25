export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  RBAC_DENIED: "RBAC_DENIED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  /** 场景引用了已缺失（被删除）的灯具。 */
  SCENE_FIXTURE_MISSING: "SCENE_FIXTURE_MISSING",
  /** 渐变/保持时长非法（非整数、为负或超出范围）。 */
  SCENE_DURATION_INVALID: "SCENE_DURATION_INVALID",
  /** 场景名称末尾序号已被其他场景占用。 */
  SCENE_DUPLICATE_SEQUENCE: "SCENE_DUPLICATE_SEQUENCE",
  /** 场景状态不是草稿，不允许继续编辑/派生。 */
  SCENE_STATUS_NOT_DRAFT: "SCENE_STATUS_NOT_DRAFT",
  /** 归档时仍有轨道引用该场景。 */
  SCENE_IN_USE_BY_TRACK: "SCENE_IN_USE_BY_TRACK",
  /** 轨道指向了不存在的场景。 */
  TRACK_SCENE_MISSING: "TRACK_SCENE_MISSING"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
