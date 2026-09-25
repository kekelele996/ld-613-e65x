/**
 * 每个实体至少 4 条日志模板；所有写操作都经 utils/log 记录。
 * 字段/动作变更时必须同步本文件与 services 中的调用处。
 */
export const LOG_TEMPLATES = {
  Fixture: ["灯具创建", "灯具更新", "灯具状态变更", "灯具导出"],
  CueScene: [
    "灯光场景创建",
    "灯光场景更新",
    "灯光场景状态变更",
    "灯光场景导出",
    "灯光场景派生草稿",
    "灯光场景归档拦截"
  ],
  TimelineTrack: [
    "时间轴轨道创建",
    "时间轴轨道更新",
    "时间轴轨道状态变更",
    "时间轴轨道导出",
    "时间轴轨道改指向场景"
  ],
  ShowProject: ["演出方案创建", "演出方案更新", "演出方案状态变更", "演出方案导出"]
} as const;

export const LOG_ACTION = {
  CUE_SCENE_CREATE: LOG_TEMPLATES.CueScene[0],
  CUE_SCENE_UPDATE: LOG_TEMPLATES.CueScene[1],
  CUE_SCENE_STATUS: LOG_TEMPLATES.CueScene[2],
  CUE_SCENE_DERIVE: LOG_TEMPLATES.CueScene[4],
  CUE_SCENE_ARCHIVE_BLOCKED: LOG_TEMPLATES.CueScene[5],
  TRACK_CREATE: LOG_TEMPLATES.TimelineTrack[0],
  TRACK_UPDATE: LOG_TEMPLATES.TimelineTrack[1],
  TRACK_STATUS: LOG_TEMPLATES.TimelineTrack[2],
  TRACK_REPOINT: LOG_TEMPLATES.TimelineTrack[4]
} as const;
