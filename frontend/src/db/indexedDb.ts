import { DB_NAME, DB_VERSION, STORES, type StoreName } from "./schema";
import { seedRows } from "../mocks/seedData";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      (Object.values(STORES) as string[]).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          // 首次创建时灌入种子数据。
          seedRows[storeName as StoreName].forEach((row) => store.add(row));
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORES[storeName], mode);
        const request = run(transaction.objectStore(STORES[storeName]));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export const idb = {
  getAll<T>(storeName: StoreName): Promise<T[]> {
    return tx(storeName, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
  },
  get<T>(storeName: StoreName, id: number): Promise<T | undefined> {
    return tx(storeName, "readonly", (store) => store.get(id) as IDBRequest<T | undefined>);
  },
  put<T>(storeName: StoreName, row: T): Promise<IDBValidKey> {
    return tx(storeName, "readwrite", (store) => store.put(row));
  },
  bulkPut<T>(storeName: StoreName, rows: T[]): Promise<void> {
    return openDb().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORES[storeName], "readwrite");
          const store = transaction.objectStore(STORES[storeName]);
          rows.forEach((row) => store.put(row));
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        })
    );
  },
  delete(storeName: StoreName, id: number): Promise<void> {
    return openDb().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORES[storeName], "readwrite");
          transaction.objectStore(STORES[storeName]).delete(id);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        })
    );
  }
};
