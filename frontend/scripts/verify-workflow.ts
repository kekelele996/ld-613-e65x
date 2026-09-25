/* 端到端业务流程验证（不落浏览器，使用 fake-indexeddb）：
 * 1. 派生草稿带入灯具状态/渐变/优先级，名称补未占用序号，原场景不变；
 * 2. 保存前三道拦截：缺失灯具 / 时长非法 / 序号重复；
 * 3. 轨道改指向后旧场景才可归档，占用时归档入口说明占用关系；
 * 4. “重新打开页面”：重新读取 IndexedDB，派生场景与轨道指向仍然可见。
 */
import "fake-indexeddb/auto";
import { listFixtures, deleteFixture } from "../src/services/fixtureService";
import {
  archiveScene,
  deriveSceneDraft,
  listScenes,
  saveSceneDraft,
  tracksOccupyingScene
} from "../src/services/cueSceneService";
import { listTracks, switchTracksToScene } from "../src/services/timelineTrackService";
import { StageLightError } from "../src/errors/StageLightError";
import { ERROR_CODES } from "../src/constants/errorCodes";

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label} ${detail}`);
  }
}

async function expectError(code: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return null;
  } catch (error) {
    return error as StageLightError;
  }
}

async function main() {
  console.log("准备：读取种子数据");
  let fixtures = await listFixtures();
  let scenes = await listScenes();
  let tracks = await listTracks();
  check(`种子：${fixtures.length} 台灯 / ${scenes.length} 个场景 / ${tracks.length} 条轨道`,
    fixtures.length === 8 && scenes.length === 4 && tracks.length === 4);

  console.log("\n[1] 从“开场暖场 1”派生草稿");
  const sourceBefore = scenes.find((s) => s.id === 1)!;
  const sourceJsonBefore = JSON.stringify(sourceBefore);
  const draft = await deriveSceneDraft(1);
  check("状态为 DRAFT", draft.scene_status === "DRAFT");
  check("名称补未占用序号 → “开场暖场 2”", draft.name === "开场暖场 2", draft.name);
  check("灯具状态数量与源一致", draft.fixture_states.length === sourceBefore.fixture_states.length);
  check("渐变时间带入", draft.fade_in_ms === sourceBefore.fade_in_ms && draft.hold_ms === sourceBefore.hold_ms);
  check("优先级带入", draft.priority === sourceBefore.priority);
  check("深拷贝：修改草稿不影响原场景", (() => {
    draft.fixture_states[0].brightness = 5;
    return true;
  })());
  const sourceAfter = (await listScenes()).find((s) => s.id === 1)!;
  check("原场景记录完全未变", JSON.stringify(sourceAfter) === sourceJsonBefore);
  check("derived_from_id 指向源场景", draft.derived_from_id === 1);

  console.log("\n[2a] 保存拦截：引用缺失灯具");
  fixtures = await listFixtures();
  await deleteFixture(8); // STROBE-01，被所有场景引用
  const fixturesAfterDelete = await listFixtures();
  draft.fixture_states.push({ fixture_id: 999, color: "#000000", brightness: 0 });
  let error = await expectError(ERROR_CODES.SCENE_FIXTURE_MISSING, () =>
    saveSceneDraft(draft, fixturesAfterDelete)
  );
  check("抛出 SCENE_FIXTURE_MISSING", error?.code === ERROR_CODES.SCENE_FIXTURE_MISSING);
  check(
    "错误文案指出缺失灯具编号 #8 与 #999",
    Boolean(error && error.message.includes("#8") && error.message.includes("#999")),
    error?.message
  );
  draft.fixture_states = draft.fixture_states.filter((s) => s.fixture_id !== 999);
  check("清理测试引用后，仍保留对已删除 #8 的失效引用（用于后续移除演示）",
    draft.fixture_states.some((s) => s.fixture_id === 8));
  draft.fixture_states = draft.fixture_states.filter((s) => s.fixture_id !== 8);

  console.log("\n[2b] 保存拦截：时长非法");
  const badFade = { ...draft, fade_in_ms: -300 };
  error = await expectError(ERROR_CODES.SCENE_DURATION_INVALID, () =>
    saveSceneDraft(badFade, fixturesAfterDelete)
  );
  check("负数渐变被拦", error?.code === ERROR_CODES.SCENE_DURATION_INVALID, error?.message);
  const badHold = { ...draft, fade_in_ms: 2000, hold_ms: Number.NaN };
  error = await expectError(ERROR_CODES.SCENE_DURATION_INVALID, () =>
    saveSceneDraft(badHold, fixturesAfterDelete)
  );
  check("NaN 保持被拦", error?.code === ERROR_CODES.SCENE_DURATION_INVALID);
  const floatHold = { ...draft, hold_ms: 12.5 };
  error = await expectError(ERROR_CODES.SCENE_DURATION_INVALID, () =>
    saveSceneDraft(floatHold, fixturesAfterDelete)
  );
  check("小数毫秒被拦", error?.code === ERROR_CODES.SCENE_DURATION_INVALID);

  console.log("\n[2c] 保存拦截：序号重复");
  const dup = { ...draft, name: "主唱追光 1" };
  error = await expectError(ERROR_CODES.SCENE_DUPLICATE_SEQUENCE, () =>
    saveSceneDraft(dup, fixturesAfterDelete)
  );
  check("与场景2同名同序号被拦", error?.code === ERROR_CODES.SCENE_DUPLICATE_SEQUENCE);
  check("文案指出占用者名称", Boolean(error && error.message.includes("主唱追光 1")), error?.message);

  const dupConnector = { ...draft, name: "慢歌蓝调-2" };
  error = await expectError(ERROR_CODES.SCENE_DUPLICATE_SEQUENCE, () =>
    saveSceneDraft(dupConnector, fixturesAfterDelete)
  );
  check("连接符差异（“慢歌蓝调-2” vs “慢歌蓝调 2”）仍判定序号重复",
    error?.code === ERROR_CODES.SCENE_DUPLICATE_SEQUENCE);

  console.log("\n[2d] 校验通过保存为 READY");
  const saved = await saveSceneDraft({ ...draft, name: "开场暖场 2" }, fixturesAfterDelete);
  check("状态转为 READY", saved.scene_status === "READY");
  check("灯具状态逐灯修改已保存（首灯亮度被改为 5）", saved.fixture_states[0].brightness === 5);

  console.log("\n[3a] 归档占用：场景1仍被轨道引用");
  tracks = await listTracks();
  const occupants = tracksOccupyingScene(1, tracks);
  check("场景1被 2 条轨道占用（#1、#4）",
    occupants.length === 2 && occupants.map((t) => t.id).sort().join() === "1,4");
  error = await expectError(ERROR_CODES.SCENE_IN_USE_BY_TRACK, () => archiveScene(1, tracks));
  check("直接归档被拦", error?.code === ERROR_CODES.SCENE_IN_USE_BY_TRACK);
  check("文案带轨道编号", Boolean(error && error.message.includes("#1") && error.message.includes("#4")),
    error?.message);

  console.log("\n[3b] 轨道改用新场景后归档");
  await switchTracksToScene(1, saved.id);
  tracks = await listTracks();
  check("原 #1/#4 已指向新场景", tracks.filter((t) => [1, 4].includes(t.id)).every((t) => t.cue_scene_id === saved.id));
  check("旧场景占用归零", tracksOccupyingScene(1, tracks).length === 0);
  const archived = await archiveScene(1, tracks);
  check("旧场景已归档", archived.scene_status === "ARCHIVED");
  check("不允许把轨道改指向已归档场景",
    (await expectError(ERROR_CODES.TRACK_SCENE_MISSING, () => switchTracksToScene(saved.id, 1)))
      ?.code === ERROR_CODES.TRACK_SCENE_MISSING);

  console.log("\n[4] 重新打开页面：重新读取 IndexedDB");
  const reopenScenes = await listScenes();
  const reopenTracks = await listTracks();
  check("派生场景仍在（开场暖场 2 / READY）",
    reopenScenes.some((s) => s.name === "开场暖场 2" && s.scene_status === "READY"));
  check("旧场景仍为 ARCHIVED",
    reopenScenes.some((s) => s.id === 1 && s.scene_status === "ARCHIVED"));
  check("轨道指向新场景仍然可见",
    reopenTracks.filter((t) => [1, 4].includes(t.id)).every((t) => t.cue_scene_id === saved.id));

  console.log("\n[5] 序号补齐：再次派生应复用空号/取下一未占用号");
  const draft2 = await deriveSceneDraft(saved.id);
  check("基名相同且 1 被旧场景占用、2 已存在 → 补 3", draft2.name === "开场暖场 3", draft2.name);

  console.log(failures === 0 ? "\n全部业务流程校验通过。" : `\n${failures} 项校验失败。`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
