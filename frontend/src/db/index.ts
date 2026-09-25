/**
 * IndexedDB 持久化封装。
 * 所有实体共用一个库 stage-light-db，首次打开时用 mocks/seedData 播种。
 *
 * 注意：IndexedDB 事务在最后一个请求成功后会立即自动提交，
 * 因此请求与所有事件监听必须在同一个同步执行块内挂好，
 * 不能先 await 请求再补挂 transaction.oncomplete，否则会错过事件、永久挂起。
 */
import { seedData } from "../mocks/seedData";

export const DB_NAME = "stage-light-db";
export const DB_VERSION = 1;

export const STORES = {
  fixture: "fixture",
  cueScene: "cueScene",
  timelineTrack: "timelineTrack",
  showProject: "showProject",
  operationLog: "operationLog"
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      });
    };
    request.onsuccess = () => {
      const db = request.result;
      seedIfEmpty(db).then(() => resolve(db), reject);
    };
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

/** 事务内只发一个请求，事务成功提交后把请求结果交还给调用方 */
function oneShot<T>(
  db: IDBDatabase,
  storeNames: StoreName | StoreName[],
  mode: IDBTransactionMode,
  issueRequest: (store: IDBObjectStore, stores: Record<string, IDBObjectStore>) => IDBRequest
): Promise<T> {
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const transaction = db.transaction(names, mode);
  const stores = Object.fromEntries(names.map((name) => [name, transaction.objectStore(name)]));
  return new Promise<T>((resolve, reject) => {
    // 监听与请求在同一个同步块内挂好，避免错过事务自动完成事件
    let result: T;
    const single = issueRequest(stores[names[0]], stores);
    single.onsuccess = () => { result = single.result as T; };
    single.onerror = () => reject(single.error);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** 事务内同步发一批写入请求，等事务整体提交 */
function batchWrite(
  db: IDBDatabase,
  name: StoreName,
  write: (store: IDBObjectStore) => void
): Promise<void> {
  const transaction = db.transaction(name, "readwrite");
  const store = transaction.objectStore(name);
  return new Promise<void>((resolve, reject) => {
    write(store);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function seedIfEmpty(db: IDBDatabase): Promise<void> {
  const count = await oneShot<number>(db, STORES.fixture, "readonly", (store) => store.count());
  if (count > 0) return;
  const seedable: Array<[StoreName, readonly { id: number }[]]> = [
    [STORES.fixture, seedData.fixture],
    [STORES.cueScene, seedData.cueScene],
    [STORES.timelineTrack, seedData.timelineTrack],
    [STORES.showProject, seedData.showProject]
  ];
  for (const [name, rows] of seedable) {
    await batchWrite(db, name, (store) => {
      for (const row of rows) {
        store.put(structuredClone(row));
      }
    });
  }
}

export async function getAll<T>(name: StoreName): Promise<T[]> {
  const db = await openDb();
  return oneShot<T[]>(db, name, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
}

export async function putRow<T extends { id: number }>(name: StoreName, row: T): Promise<T> {
  const db = await openDb();
  await batchWrite(db, name, (store) => {
    store.put(structuredClone(row));
  });
  return row;
}

export async function bulkPut<T extends { id: number }>(name: StoreName, rows: T[]): Promise<void> {
  const db = await openDb();
  await batchWrite(db, name, (store) => {
    for (const row of rows) {
      store.put(structuredClone(row));
    }
  });
}

export async function deleteRow(name: StoreName, id: number): Promise<void> {
  const db = await openDb();
  await batchWrite(db, name, (store) => {
    store.delete(id);
  });
}

export async function nextId(name: StoreName): Promise<number> {
  const rows = await getAll<{ id: number }>(name);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

/** 测试辅助：关闭连接并清空缓存，模拟“重新打开页面” */
export async function closeDbForTest(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = null;
  }
}
