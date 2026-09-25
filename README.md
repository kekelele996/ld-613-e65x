# 舞台灯光编排模拟器（stage-light）

纯前端舞台灯光编排工具：管理灯具、从调好的场景派生草稿做巡演手工重排、校验后把轨道改用新场景再归档旧场景，并支持按时间轴预览灯光变化。所有数据保存在浏览器 **IndexedDB**，无第三方 API。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20113>

停止与清理：

```bash
docker compose down        # 停止
docker compose down -v     # 停止（本项目无服务端卷；浏览器 IndexedDB 数据需在浏览器里清站点数据）
```

## 本地开发方式

```bash
cd frontend
npm install
npm run dev        # http://localhost:20113
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建
```

### 业务流程验证脚本（不依赖浏览器）

```bash
cd frontend
npm install
npx tsx scripts/verify-workflow.ts   # 30 项 service 层端到端断言
npx tsx scripts/verify-ui.tsx        # jsdom + fake-indexeddb 的四个页面冒烟测试
```

覆盖：派生草稿带灯具状态/渐变时间/优先级、名称补未占用序号、原场景不变；保存前三道拦截（缺失灯具 / 时长非法 / 序号重复）；轨道改指向后旧场景才允许归档、占用时给出占用轨道清单；“重新打开页面”后派生场景与轨道指向仍可见。

## 核心业务流程（巡演手工重排）

1. **派生草稿**：在“场景编辑”对任意非归档场景点“派生草稿”。构造器深拷贝源场景的灯具状态、`fade_in_ms`/`hold_ms`、`priority`，状态置为 `DRAFT`，名称在基名后自动补第一个未占用序号（如“开场暖场 1”→“开场暖场 2”）。原场景记录不做任何修改。
2. **逐灯调光**：草稿编辑器内逐台灯调颜色（取色器）与亮度（0–100 滑块），可增删灯具、改序号名称、渐变/保持时长与优先级。
3. **保存前三道关卡**（命中即停下，并在页面顶部指出原因）：
   - 引用了已缺失灯具（被删除的灯具 id）→ `SCENE_FIXTURE_MISSING`；
   - 渐变/保持时长不是 0–3,600,000 之间的整数毫秒 → `SCENE_DURATION_INVALID`；
   - 名称末尾序号与其它场景（忽略空格/`-`/`_` 连接符差异）重复 → `SCENE_DUPLICATE_SEQUENCE`。
   通过后草稿由 `DRAFT` 转为 `READY`。
4. **轨道改用新场景**：在“时间轴编排”选中旧场景、勾选要迁移的轨道（默认全部）、选择新场景后“改指向”。不能把轨道指向已归档/不存在的场景。
5. **归档旧场景**：仍有轨道引用时，归档入口（“归档（被占用）”）会被拦下并展开占用关系：轨道编号、图层、起始时刻；占用归零后才真正置为 `ARCHIVED`。
6. **重新打开页面**：数据在 IndexedDB，刷新/重开浏览器后派生场景、状态与轨道指向全部仍在，舞台预览可直接播放。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 状态管理 | Zustand 独立 store（`src/stores/*`） |
| 持久化 | IndexedDB（`src/db/indexedDb.ts`，首次打开灌入 `mocks/seedData.ts`） |
| 样式 | 原生 CSS（类 Tailwind 风格的工具化类名，无构建依赖） |
| 路由 | Hash 路由（`src/router/routes.ts`，适配 Nginx SPA fallback） |
| 部署 | Docker Compose + 多阶段 Dockerfile + Nginx |

## 项目目录结构

```text
frontend/src/
├── api/                  # controller 层：按模型分文件封装 async 调用，二次包装异常
├── services/             # service 层：派生、校验、归档、轨道改指向等业务规则
├── stores/               # Zustand 独立 store（Fixture/CueScene/TimelineTrack/ShowProject）
├── db/                   # IndexedDB 连接、对象仓库 schema
├── types/                # 数据模型与重复定义的枚举类型
├── constants/            # 枚举、日志模板、错误码、错误消息、状态文案
├── errors/               # StageLightError（错误码 + 模板渲染）
├── constructors/         # 默认对象/表单对象/响应对象/派生草稿构造器
├── components/common/    # FixtureIcon / CueCard / TimelineRuler / StageCanvas / ColorChannelSlider 等
├── components/cues/      # 草稿编辑器、归档占用入口
├── components/layout/    # AppShell（侧边导航 + hash 路由）
├── hooks/                # useTimelinePlayback / useDmxAddressCheck / useIndexedDbStore
├── pages/                # 灯具布置 / 场景编辑 / 时间轴编排 / 舞台预览
├── router/               # 路由表与 hash 读取
├── utils/                # formatters（日期/状态/时间/颜色混合）、logger、ids
├── mocks/                # 种子数据（IndexedDB 首次初始化灌入）
└── main.tsx
```

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `stage-light` | Compose 项目名，同时作为容器名前缀 |
| `FRONTEND_PORT` | `20113` | 宿主机映射到容器 80 端口的前端端口 |

## Docker 部署说明

- 根目录 `docker-compose.yml`：顶层 `name: stage-light`，不写 `version:` 字段，只编排 `frontend` 一个服务。
- 容器名：`${COMPOSE_PROJECT_NAME:-stage-light}-frontend`；端口映射 `${FRONTEND_PORT:-20113}:80`。
- `frontend/Dockerfile` 为多阶段构建：Node 构建静态资源 → Nginx 托管。
- `frontend/nginx.conf` 配置 `try_files $uri $uri/ /index.html;`，刷新 `/cues` 等深链不 404。
- 本项目是纯前端应用，数据存于浏览器 IndexedDB（无服务端数据库卷）；需要重置排练数据时，在浏览器清除站点数据，或在 DevTools → Application → IndexedDB 删除 `stage-light` 库。
- 常见问题：
  - 端口占用：修改 `.env` 中 `FRONTEND_PORT` 后 `docker compose up -d`；
  - 在中文目录名下部署：静态资源走相对路径与 Nginx 托管，不依赖工作目录名；
  - 白屏：确认访问的是映射后的端口，且容器内 80 端口健康。

## 枚举/常量出现位置清单

### FixtureType（PAR / SPOT / WASH / BEAM / STROBE）

- 常量：`constants/FixtureType.ts`；类型重复定义：`types/FixtureType.ts`
- 构造器：`constructors/FixtureConstructor.ts`（默认 `PAR`）
- 种子数据：`mocks/seedData.ts`
- 日志模板：`constants/logTemplates.ts`（`Fixture.create` 输出 `{type}`）
- 错误/格式化：`utils/formatters.ts` 的 `formatFixtureType`
- 筛选器：`pages/FixturesPage.tsx` 类型筛选 chips
- 展示组件：`components/common/FixtureIcon.tsx`（首字母角标 + title）

### CueStatus（DRAFT / READY / DISABLED / ARCHIVED）

- 常量：`constants/CueStatus.ts`；类型重复定义：`types/CueStatus.ts`
- 构造器：`constructors/CueSceneConstructor.ts`（默认 `DRAFT`、派生草稿强制 `DRAFT`）
- service/API：`services/cueSceneService.ts`、`api/CueScene.ts`（保存转 `READY`、归档转 `ARCHIVED`）
- 日志模板：`constants/logTemplates.ts` 的 `CueScene.*`
- 错误码/错误消息：`constants/errorCodes.ts`、`constants/errorMessages.ts`（归档占用、状态非法）
- 格式化：`utils/formatters.ts` 的 `formatStatus`
- 筛选器：`pages/CuesPage.tsx` 状态筛选（ALL/DRAFT/READY/DISABLED/ARCHIVED）
- 展示组件：`components/common/StatusBadge.tsx`、`components/common/CueCard.tsx`、时间轴块状态标

### ChannelMode（RGB / RGBW / DIMMER_ONLY / MOVING_HEAD）

- 常量：`constants/ChannelMode.ts`；类型重复定义：`types/ChannelMode.ts`
- 构造器：`constructors/FixtureConstructor.ts`（默认 `RGB`）
- 种子数据：`mocks/seedData.ts`
- 日志/错误：灯具写操作日志模板；表单校验消息
- 格式化：`utils/formatters.ts` 的 `formatChannelMode`
- 筛选器：`pages/FixturesPage.tsx` 通道模式筛选 chips
- 展示：灯具清单表格与 `FixtureIcon` title

## 为什么该项目会“牵一发动全身”

- 新增一个枚举值要同步：`constants/*` 与 `types/*` 双份枚举、中文文案表、`utils/formatters.ts`、筛选 chips、`StatusBadge` 色调表、构造器默认值、种子数据与 README 清单。
- 新增一个场景字段要同步：`types/CueScene.ts`、`constructors/CueSceneConstructor.ts`（默认值 + 派生拷贝）、`services/cueSceneValidator.ts`（校验）、`constants/logTemplates.ts` 模板与调用处、草稿编辑器表单、`CueCard` 展示、种子数据。
- 错误按“错误码（constants/errorCodes）→ 消息模板（constants/errorMessages）→ StageLightError → service 抛出 → api/controller 二次包装 → store → 页面 Alert”分层传递，改一条文案要沿链路核对。
- 校验规则集中在 `services/cueSceneValidator.ts`，命名序号规则集中在 `services/sceneNameSequence.ts`，但被 API、store、页面多处直接依赖，任何规则变化都影响派生、保存、归档三条流程。
- `utils/formatters.ts` 故意混合日期、数字、风险等级、枚举文案、毫秒时钟、颜色混合，被四个页面与多个共享组件共同引用。

## License

MIT
