export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  SCENE_FIXTURE_MISSING: "场景引用了不存在的灯具（ID {fixtureId}），请删除该灯或补回灯具后再保存",
  SCENE_DURATION_INVALID: "{fieldLabel}必须是大于等于 0 的整数毫秒值",
  SCENE_SEQUENCE_DUPLICATE: "场景序号 {seq} 已被“{name}”占用，请换一个未占用序号",
  SCENE_NAME_EMPTY: "场景名称不能为空",
  SCENE_ARCHIVE_IN_USE: "场景仍被 {count} 条轨道引用（{tracks}），先把轨道改指向新场景后才能归档",
  SCENE_NOT_FOUND: "场景不存在或已被删除（ID {id}）",
  TRACK_TARGET_ARCHIVED: "目标场景“{name}”已归档，不能被轨道引用"
} as const;
