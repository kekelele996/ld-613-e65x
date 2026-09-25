import assert from "node:assert";
import { validateSceneDraftWith } from "../src/services/CueSceneService";
import { extractSceneSequence, isValidDuration } from "../src/utils/formatters";

const fixtures = [
  { id: 1, fixture_code: "P1", fixture_type: "PAR", position_x: 0, position_y: 0, dmx_address: 1, channel_count: 4, color_mode: "RGB" },
  { id: 2, fixture_code: "P2", fixture_type: "WASH", position_x: 0, position_y: 0, dmx_address: 5, channel_count: 6, color_mode: "RGBW" }
] as any;

const scenes = [
  { id: 1, name: "开场 1", fixture_states: [], fade_in_ms: 500, hold_ms: 3000, priority: 1, scene_status: "READY" },
  { id: 2, name: "主唱 2", fixture_states: [], fade_in_ms: 500, hold_ms: 3000, priority: 1, scene_status: "READY" }
] as any;

// 1. 引用缺失灯具
let issues = validateSceneDraftWith(
  { id: 99, name: "新场景 5", fixture_states: [{ fixture_id: 7, red: 1, green: 2, blue: 3, brightness: 50 }], fade_in_ms: 100, hold_ms: 200, priority: 1, scene_status: "DRAFT" },
  fixtures, scenes, []
);
assert(issues.some((i) => i.code === "SCENE_FIXTURE_MISSING" && i.fixture_id === 7), "应报缺失灯具 #7");

// 2. 时长非法
issues = validateSceneDraftWith(
  { id: 99, name: "新场景 5", fixture_states: [], fade_in_ms: -1, hold_ms: 1.5, priority: 1, scene_status: "DRAFT" } as any,
  fixtures, scenes, []
);
assert(issues.filter((i) => i.code === "SCENE_DURATION_INVALID").length === 2, "两个非法时长都应报出");

// 3. 序号重复
issues = validateSceneDraftWith(
  { id: 99, name: "另一个 2", fixture_states: [], fade_in_ms: 0, hold_ms: 0, priority: 1, scene_status: "DRAFT" },
  fixtures, scenes, []
);
assert(issues.some((i) => i.code === "SCENE_SEQUENCE_DUPLICATE" && i.message.includes("主唱 2")), "序号 2 重复应指出占用者");

// 4. 自身 id 不算重复
issues = validateSceneDraftWith({ ...scenes[1], name: "主唱改名 2" }, fixtures, scenes, []);
assert(!issues.some((i) => i.code === "SCENE_SEQUENCE_DUPLICATE"), "编辑自身时同名序号不算重复");

// 5. 全部合法
issues = validateSceneDraftWith(
  { id: 99, name: "全新场景 9", fixture_states: [{ fixture_id: 1, red: 1, green: 2, blue: 3, brightness: 50 }], fade_in_ms: 0, hold_ms: 0, priority: 1, scene_status: "DRAFT" },
  fixtures, scenes, []
);
assert.deepStrictEqual(issues, [], "合法草稿不应有问题");

// 6. 工具函数
assert.strictEqual(extractSceneSequence("开场 12"), 12);
assert.strictEqual(extractSceneSequence("暖场备用"), null);
assert.strictEqual(isValidDuration(0), true);
assert.strictEqual(isValidDuration(-3), false);
assert.strictEqual(isValidDuration(1.2), false);

// 7. 派生名称补位逻辑：序号对所有场景名末尾数字去重
const occupiedNamesList = scenes.map((s: any) => s.name.trim());
const occupiedNames = new Set(occupiedNamesList);
const occupiedSeqs = new Set(occupiedNamesList.map(extractSceneSequence).filter((v: number | null): v is number => v !== null));
const baseName = "开场".trim();
let seq = 1;
const candidate = () => `${baseName} ${seq}`;
while (occupiedNames.has(candidate()) || occupiedSeqs.has(seq)) seq++;
assert.strictEqual(candidate(), "开场 3", "序号 1、2 均已占用，应补到 3");

console.log("ALL SERVICE TESTS PASSED");
