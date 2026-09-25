import "fake-indexeddb/auto";
import assert from "node:assert";
import { deriveSceneDraft } from "../src/services/CueSceneService";
import { persistSceneDraft, archiveScene } from "../src/services/CueSceneService";
import { repointTrack } from "../src/services/TimelineTrackService";
import { saveTimelineTrack } from "../src/api/TimelineTrack";
import { listCueScene } from "../src/api/CueScene";
import { listTimelineTrack } from "../src/api/TimelineTrack";
import { listFixture } from "../src/api/Fixture";

const fail = (msg: string) => { throw new Error(msg); };

const scenes = await listCueScene();
const tracks = await listTimelineTrack();
const fixtures = await listFixture();
assert(scenes.length === 4, "种子场景 4 条");
assert(tracks.length === 3, "种子轨道 3 条");
assert(fixtures.length === 5, "种子灯具 5 台");

// 1. 从场景 1 派生：序号 1、2、3 均被占用 -> 应补到 4
const draft = await deriveSceneDraft(1);
assert(draft.scene_status === "DRAFT", "派生草稿为 DRAFT");
assert.strictEqual(draft.name, "开场 4", `实际名称：${draft.name}`);
assert(draft.fade_in_ms === 500 && draft.hold_ms === 3000 && draft.priority === 10, "渐变/保持/优先级随源场景");
assert.deepStrictEqual(
  draft.fixture_states.map((s) => s.fixture_id),
  [1, 2, 3],
  "带出全部灯具状态"
);

// 2. 修改草稿不影响原场景
draft.fixture_states[0].brightness = 5;
const origin = (await listCueScene()).find((s) => s.id === 1)!;
assert.strictEqual(origin.fixture_states[0].brightness, 80, "原场景亮度不变");
assert.notStrictEqual(draft.id, origin.id, "草稿是新 id");

// 3. 保存草稿
const saved = await persistSceneDraft(draft);
assert.strictEqual(saved.scene_status, "DRAFT", "保存后仍为草稿（不自动发布）");

// 4. 场景 1 被轨道 #1 #3 引用，归档必须被拦截并带占用信息
try {
  await archiveScene(1);
  fail("场景 1 仍被轨道引用，归档应被拦截");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  assert(message.includes("2 条轨道"), `拦截消息应说明占用数量：${message}`);
  assert(message.includes("#1") && message.includes("#3"), `应列出占用轨道：${message}`);
}

// 5. 把引用场景 1 的轨道逐个改指向新场景（#3 已锁定，先解锁）
const locked3 = tracks.find((t) => t.id === 3)!;
if (locked3.locked) await saveTimelineTrack({ ...locked3, locked: false });
await repointTrack(1, saved.id);
await repointTrack(3, saved.id);

// 6. 无引用后归档成功
const archived = await archiveScene(1);
assert.strictEqual(archived.scene_status, "ARCHIVED");

// 7. 已归档场景不能被轨道引用
try {
  await repointTrack(2, 1);
  fail("轨道不能改指向已归档场景");
} catch (error) {
  assert((error as Error).message.includes("已归档"));
}

// 8. 模拟“重新打开页面”：关闭连接并清空模块缓存后重新读取，数据仍在
const dbModule = await import("../src/db/index");
await dbModule.closeDbForTest();
await new Promise((resolve) => setTimeout(resolve, 50));
const reopenedScenes = await listCueScene();
const reopenedTracks = await listTimelineTrack();
const derived = reopenedScenes.find((s) => s.id === saved.id);
assert(derived && derived.name === "开场 4", "重开后派生场景仍可见");
assert(reopenedTracks.find((t) => t.id === 1)!.cue_scene_id === saved.id, "重开后轨道 #1 仍指向派生场景");
assert(reopenedTracks.find((t) => t.id === 3)!.cue_scene_id === saved.id, "重开后轨道 #3 仍指向派生场景");
assert(reopenedScenes.find((s) => s.id === 1)!.scene_status === "ARCHIVED", "重开后归档状态保留");

console.log("ALL PERSISTENCE/FLOW TESTS PASSED");
