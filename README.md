# 舞台灯光编排模拟器

纯前端舞台灯光编排工具，支持灯具通道、场景 Cue、时间轴预览和演出方案导出，所有数据存在 IndexedDB。

## 核心业务（手工重排）

- **派生草稿**：在 `/cues` 从已有场景“派生草稿”，自动带出全部灯具状态（颜色/亮度）、渐变时间（淡入/保持）与优先级；名称按“基础名 + 第一个未占用序号”补位，原场景不做任何修改。
- **逐灯调光**：草稿中逐台灯调 R/G/B 与亮度，可加入/移除灯具。
- **保存前校验（不通过即停下并逐条指出原因）**：
  - 引用了已缺失的灯具 → 指出灯具 ID；
  - 淡入/保持时长不是非负整数毫秒 → 指出字段；
  - 名称末尾序号已被其他场景占用 → 指出占用场景名；
  - 名称为空。
- **归档占用关系**：仍被轨道引用的场景不能归档，归档入口禁用并提示“N 条轨道占用（#id(图层…)）”；到 `/timeline` 把轨道改指向新场景后，旧场景才可归档。已归档场景不能再被轨道引用，锁定轨道需先解锁。
- **持久化**：派生场景与轨道指向写入 IndexedDB，重新打开页面后仍然可见（舞台预览页可核对）。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20113>



## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`



## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Redux Toolkit + IndexedDB |
| 后端 | - |
| 数据库 | 本地模拟数据 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks, services, controllers, db
```

关键分层：`db`（IndexedDB 连接/事务）→ `api`（按模型的数据访问）→ `services`（派生/校验/归档/改指向规则）→ `controllers`（异常二次包装）→ `stores`（Zustand）→ `pages/components`。

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `stage-light`
- `FRONTEND_PORT`: 前端端口，默认 `20113`


## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: stage-light`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-stage-light}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FixtureType: constants/FixtureType、types/FixtureType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- CueStatus: constants/CueStatus、types/CueStatus、constructors、logTemplates、errorMessages、errorCodes、services(CueSceneService)、controllers(CueSceneController)、stores(CueSceneStore)、筛选器、展示组件/控制器（StatusBadge、CueCard、CuesPage、TimelinePage、PreviewPage）均有引用。
- ChannelMode: constants/ChannelMode、types/ChannelMode、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
