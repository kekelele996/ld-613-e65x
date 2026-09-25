import type { CueScene, FixtureLightState } from "../types/CueScene";
import { nextId, STORES } from "../db";
import { extractSceneSequence } from "../utils/formatters";

export const createDefaultCueScene = (overrides: Partial<CueScene> = {}): CueScene => ({
  id: 0,
  name: "",
  fixture_states: [],
  fade_in_ms: 500,
  hold_ms: 3000,
  priority: 0,
  scene_status: "DRAFT",
  ...overrides
});

export const createCueSceneForm = createDefaultCueScene;
export const createCueSceneResponse = createDefaultCueScene;

/**
 * 从已有场景派生草稿：深拷贝灯具状态、渐变时间和优先级，
 * 名称补上第一个未占用序号。原场景对象不做任何修改。
 */
export async function createDerivedCueSceneDraft(
  source: CueScene,
  occupiedNamesList: string[]
): Promise<CueScene> {
  const id = await nextId(STORES.cueScene);
  const baseName = source.name.replace(/\s*\d+\s*$/, "").trim() || source.name.trim();
  const occupiedNames = new Set(occupiedNamesList.map((name) => name.trim()));
  // 序号按“任意场景名末尾数字”判定占用，避免派生后保存被序号重复拦下
  const occupiedSeqs = new Set(
    occupiedNamesList.map((name) => extractSceneSequence(name)).filter((value): value is number => value !== null)
  );
  let seq = 1;
  while (occupiedNames.has(`${baseName} ${seq}`) || occupiedSeqs.has(seq)) seq += 1;
  const states: FixtureLightState[] = source.fixture_states.map((state) => ({ ...state }));
  return createDefaultCueScene({
    id,
    name: `${baseName} ${seq}`,
    fixture_states: states,
    fade_in_ms: source.fade_in_ms,
    hold_ms: source.hold_ms,
    priority: source.priority,
    scene_status: "DRAFT"
  });
}
