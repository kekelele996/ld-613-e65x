export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  SCENE_FIXTURE_MISSING: "场景引用了缺失灯具（编号 {codes}），请移除后再保存",
  SCENE_DURATION_INVALID: "{field}时长非法：{value}，需为 0-3600000 之间的整数毫秒",
  SCENE_DUPLICATE_SEQUENCE: "场景名称“{name}”的序号 {sequence} 已被“{owner}”占用，请更换未占用序号",
  SCENE_STATUS_NOT_DRAFT: "仅草稿状态的场景可编辑，当前状态为 {status}",
  SCENE_IN_USE_BY_TRACK: "场景仍被 {count} 条轨道占用（轨道编号 {tracks}），请先把这些轨道改指向新场景后再归档",
  TRACK_SCENE_MISSING: "轨道引用的场景不存在（场景 id：{id}）"
} as const;
