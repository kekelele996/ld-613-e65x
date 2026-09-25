/* 交互验证（只用真实 click，jsdom+tsx 下合成 input 事件 React 不响应）：
 * A. 派生草稿后，删掉草稿引用的灯具，再点“校验并保存” → 页面出现“保存已停下：场景引用了缺失灯具”；
 * B. 被占用场景的归档入口点击后展开占用关系（轨道编号/图层），引导先改指向。
 */
import { JSDOM } from "jsdom";
import "fake-indexeddb/auto";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { CuesPage } from "../src/pages/CuesPage";
import { FixturesPage } from "../src/pages/FixturesPage";
import { useCueSceneStore } from "../src/stores/CueSceneStore";
import { useFixtureStore } from "../src/stores/FixtureStore";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:20113/",
  pretendToBeVisual: true
});
(globalThis as { [k: string]: unknown }).window = dom.window;
(globalThis as { [k: string]: unknown }).document = dom.window.document;
(globalThis as { [k: string]: unknown }).navigator = dom.window.navigator;
(globalThis as { [k: string]: unknown }).HTMLElement = dom.window.HTMLElement;
(globalThis as { [k: string]: unknown }).Node = dom.window.Node;
(globalThis as { [k: string]: unknown }).Element = dom.window.Element;
(globalThis as { [k: string]: unknown }).requestAnimationFrame = (
  cb: FrameRequestCallback
) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
(globalThis as { [k: string]: unknown }).cancelAnimationFrame = (id: number) =>
  clearTimeout(id);
(globalThis as { [k: string]: unknown }).confirm = () => true;

const flush = (ms = 30) => new Promise((r) => setTimeout(r, ms));
async function waitFor(predicate: () => boolean, timeout = 3000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return true;
    await act(async () => {
      await flush(30);
    });
  }
  return predicate();
}

let failures = 0;
const check = (label: string, ok: boolean, detail = "") =>
  ok ? console.log(`  ✓ ${label}`) : ((failures += 1), console.error(`  ✗ ${label} ${detail}`));

const clickByText = (root: ParentNode, text: string) => {
  const btn = Array.from(root.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text)
  );
  if (!btn) throw new Error(`找不到按钮：${text}`);
  btn.click();
};

async function main() {
  console.log("[准备] 删除一台被场景引用的灯具（STROBE-01，id=8）");
  await useFixtureStore.getState().load();
  await useFixtureStore.getState().remove(8);
  check("灯具数由 8 变为 7", useFixtureStore.getState().rows.length === 7);

  const el = document.getElementById("root")!;
  const root = createRoot(el);
  await act(async () => {
    root.render(<CuesPage />);
  });
  await waitFor(() => el.textContent?.includes("开场暖场 1") ?? false);

  console.log("[保存拦截 UI]");
  await act(async () => {
    clickByText(el, "派生草稿");
  });
  await waitFor(() => el.textContent?.includes("草稿编辑 · 开场暖场 2") ?? false);
  check(
    "编辑器出现黄色警告，提示引用了 1 台缺失灯具 #8",
    el.textContent?.includes("1 台已缺失灯具") && el.textContent.includes("#8"),
    el.textContent?.match(/草稿引用了[^。]*。/)?.[0]
  );

  await act(async () => {
    clickByText(el, "校验并保存");
  });
  await waitFor(() => el.textContent?.includes("保存已停下") ?? false);
  check("出现“保存已停下”", el.textContent?.includes("保存已停下") ?? false);
  check(
    "指出原因为缺失灯具",
    el.textContent?.includes("缺失灯具") && el.textContent.includes("#8"),
    el.textContent?.match(/保存已停下[^。]*。/)?.[0]
  );
  check("草稿编辑器仍停留在页面上（未保存为 READY）",
    el.textContent?.includes("草稿编辑 · 开场暖场 2") ?? false);
  const draftInStore = useCueSceneStore
    .getState()
    .rows.find((s) => s.name === "开场暖场 2");
  check("store 中草稿仍是 DRAFT", draftInStore?.scene_status === "DRAFT");

  console.log("[归档占用说明 UI]");
  await act(async () => {
    clickByText(el, "收起");
  });
  const vocalCard = Array.from(el.querySelectorAll<HTMLElement>(".cue-card")).find(
    (card) => card.textContent?.includes("主唱追光 1")
  )!;
  const archiveBtn = Array.from(vocalCard.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("归档")
  )!;
  check("归档入口显示被占用态", archiveBtn.textContent?.includes("被占用") ?? false);
  await act(async () => {
    archiveBtn.click();
  });
  await waitFor(() => el.textContent?.includes("轨道#3") ?? false);
  check("展开占用轨道编号 #3", el.textContent?.includes("轨道#3") ?? false);
  check("说明图层（图层 2）", el.textContent?.includes("图层 2") ?? false);
  check("引导先到时间轴改指向新场景", el.textContent?.includes("改指向新场景") ?? false);

  console.log("[灯具页删除提示 UI]");
  await act(async () => {
    root.render(<FixturesPage />);
  });
  await waitFor(() => el.textContent?.includes("PAR-01") ?? false);
  check("灯具页正常渲染且灯具为 7 台",
    el.textContent?.includes("PAR-01") && useFixtureStore.getState().rows.length === 7);

  console.log(failures === 0 ? "\n交互验证通过。" : `\n${failures} 项失败。`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
