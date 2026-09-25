import "fake-indexeddb/auto";

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`-> ${label} ... `);
  try {
    const result = await fn();
    console.log("ok", result);
  } catch (error) {
    console.log("ERR", error);
    throw error;
  }
}

await step("indexeddb env", async () => {
  return `indexedDB=${typeof indexedDB} structuredClone=${typeof structuredClone}`;
});
await step("openDb", async () => {
  const dbModule = await import("../src/db/index");
  const db = await dbModule.openDb();
  return `${db.name} stores=${Array.from(db.objectStoreNames).join(",")}`;
});
await step("listFixture", async () => (await import("../src/api/Fixture")).listFixture().then((r) => r.length));
await step("listCueScene", async () => (await import("../src/api/CueScene")).listCueScene().then((r) => r.length));
await step("listTimelineTrack", async () => (await import("../src/api/TimelineTrack")).listTimelineTrack().then((r) => r.length));
console.log("PROBE DONE");
