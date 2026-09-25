/**
 * 每个实体 ≥ 4 条日志模板，写操作（service 层）都要经过 logger 记录。
 * 新增/修改字段时，模板与调用处必须同步修改。
 */
export const LOG_TEMPLATES = {
  Fixture: {
    create: "灯具创建：{code}（{type}，DMX {address}）",
    update: "灯具更新：{code} 字段 {field} 由 {from} 变更为 {to}",
    delete: "灯具删除：{code}（id {id}）",
    import: "灯具导入：共 {count} 条"
  },
  CueScene: {
    create: "灯光场景创建：{name}（优先级 {priority}，状态 {status}）",
    derive: "灯光场景派生：由 {source} 派生草稿 {name}（淡入 {fade}ms / 保持 {hold}ms / 优先级 {priority}）",
    update: "灯光场景更新：{name} 灯具状态/时序字段已调整",
    save: "灯光场景保存：{name} 校验通过并写入（{count} 台灯）",
    archive: "灯光场景归档：{name}（id {id}）",
    export: "灯光场景导出：{count} 条"
  },
  TimelineTrack: {
    create: "时间轴轨道创建：图层 {layer}，起始 {start}ms",
    update: "时间轴轨道更新：轨道 {id} 场景指向由 {from} 切换为 {to}",
    switch: "时间轴轨道切换：{count} 条轨道由 {from} 批量改指向 {to}",
    lock: "时间轴轨道锁定变更：轨道 {id} → {locked}",
    export: "时间轴轨道导出：{count} 条"
  },
  ShowProject: {
    create: "演出方案创建：{title}（场馆 {venue}）",
    update: "演出方案更新：{title} 聚合灯具/轨道已调整",
    archive: "演出方案状态变更：{title} → {status}",
    export: "演出方案导出：{count} 条"
  }
} as const;

export type LogTemplateMap = typeof LOG_TEMPLATES;
