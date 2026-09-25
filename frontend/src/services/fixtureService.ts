import type { Fixture } from "../types/Fixture";
import type { StoreName } from "../db/schema";
import { idb } from "../db/indexedDb";
import { createDefaultFixture } from "../constructors/FixtureConstructor";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { writeLog } from "../utils/logger";
import { nextId } from "../utils/ids";

const STORE: StoreName = "fixture";

export async function listFixtures(): Promise<Fixture[]> {
  return idb.getAll<Fixture>(STORE);
}

export async function createFixture(input: Partial<Fixture>): Promise<Fixture> {
  const rows = await listFixtures();
  const fixture = createDefaultFixture({ ...input, id: nextId(rows) });
  await idb.put(STORE, fixture);
  writeLog("Fixture", "create", LOG_TEMPLATES.Fixture.create, {
    code: fixture.fixture_code,
    type: fixture.fixture_type,
    address: fixture.dmx_address
  });
  return fixture;
}

export async function updateFixture(fixture: Fixture): Promise<Fixture> {
  await idb.put(STORE, fixture);
  writeLog("Fixture", "update", LOG_TEMPLATES.Fixture.update, {
    code: fixture.fixture_code,
    field: "全部",
    from: "-",
    to: "已更新"
  });
  return fixture;
}

/**
 * 删除灯具：保留场景里的失效引用，以便再次保存草稿时由校验器指出“引用缺失灯具”。
 */
export async function deleteFixture(id: number): Promise<void> {
  const rows = await listFixtures();
  const target = rows.find((row) => row.id === id);
  await idb.delete(STORE, id);
  writeLog("Fixture", "delete", LOG_TEMPLATES.Fixture.delete, {
    code: target?.fixture_code ?? "未知灯具",
    id
  });
}
