/* UI 冒烟测试：用 jsdom + fake-indexeddb 挂载真实 React 应用，
 * 验证四个页面均可渲染、IndexedDB 种子数据出现在界面上、
 * “派生草稿”点击后出现未占用序号名称与逐灯编辑器。 */
import { JSDOM } from "jsdom";
import "fake-indexeddb/auto";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { CuesPage } from "../src/pages/CuesPage";
import { FixturesPage } from "../src/pages/FixturesPage";
import { TimelinePage } from "../src/pages/TimelinePage";
import { PreviewPage } from "../src/pages/PreviewPage";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:20113/",
  pretendToBeVisual: true
});
(globalThis as { window?: unknown }).window = dom.window;
(globalThis as { document?: unknown }).document = dom.window.document;
(globalThis as { navigator?: unknown }).navigator = dom.window.navigator;
(globalThis as { HTMLElement?: unknown }).HTMLElement = dom.window.HTMLElement;
(globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 0) as unknown as number;
(globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = (id: number) => clearTimeout(id);
(globalThis as { confirm?: unknown }).confirm = () => true;

const flush = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    failures += 1;
    console.error(`  ✗ ${label} ${detail}`);
  }
}

async function mount(element: React.ReactElement) {
  const container = dom.window.document.getElementById("root")!;
  await act(async () => {
    createRoot(container).render(element);
    await flush(50);
  });
  return container;
}

async function remount<T extends React.ReactElement>(element: T) {
  const rootEl = document.getElementById("root")!;
  await act(async () => {
    rootEl.innerHTML = "";
    createRoot(rootEl).render(element);
    await flush(50);
  });
  return rootEl;
}

async function main() {
  console.log("[灯具布置]");
  const fixturesPage = await mount(<FixturesPage />);
  await flush(50);
  check("灯具表格出现 PAR-01", fixturesPage.textContent?.includes("PAR-01") ?? false);
  check("DMX 无冲突提示出现", fixturesPage.textContent?.includes("DMX 通道区间无冲突") ?? false);

  console.log("[场景编辑]");
  const cuesPage = await remount(<CuesPage />);
  await flush(80);
  check("渲染种子场景“开场暖场 1”", cuesPage.textContent?.includes("开场暖场 1") ?? false);
  check("渲染“派生草稿”按钮", cuesPage.textContent?.includes("派生草稿") ?? false);

  // 点击“开场暖场 1”卡片里的“派生草稿”按钮（第一张卡片的第一个派生按钮）。
  const deriveButtons = Array.from(cuesPage.querySelectorAll("button")).filter(
    (b) => b.textContent?.trim() === "派生草稿"
  );
  check("有 3 个可派生入口（就绪/停用/草稿，归档除外）", deriveButtons.length === 3, `实际 ${deriveButtons.length}`);
  await act(async () => {
    deriveButtons[0].click();
    await flush(80);
  });
  check(
    "派生后出现编辑器与“开场暖场 2”",
    cuesPage.textContent?.includes("草稿编辑 · 开场暖场 2") ?? false,
    cuesPage.textContent?.slice(0, 200)
  );
  check("逐灯滑块渲染（8 台灯）", cuesPage.querySelectorAll('input[type="range"]').length === 8);
  check("颜色选择器渲染（8 个）", cuesPage.querySelectorAll('input[type="color"]').length === 8);
  check("提示原场景不受影响", cuesPage.textContent?.includes("原场景不会被修改") ?? false);

  // 重新挂载页面组件，模拟“重新打开页面”，草稿已在 IndexedDB。
  const reopened = await remount(<CuesPage />);
  await flush(80);
  check("重开页面后仍可见“开场暖场 2”", reopened.textContent?.includes("开场暖场 2") ?? false);

  console.log("[时间轴编排]");
  const timelinePage = await remount(<TimelinePage />);
  await flush(80);
  check("轨道块出现源场景名称", timelinePage.textContent?.includes("开场暖场 1") ?? false);
  check("改指向面板存在", timelinePage.textContent?.includes("轨道改用新场景") ?? false);
  check("归档前源场景被引用提示文案在轨道切换区", timelinePage.textContent?.includes("旧场景归档前置") ?? false);

  console.log("[舞台预览]");
  const previewPage = await remount(<PreviewPage />);
  await flush(80);
  check("播放控制渲染", previewPage.textContent?.includes("播放") ?? false);
  check("舞台画布存在", previewPage.querySelectorAll(".stage-canvas").length === 1);
  check("8 台灯渲染在画布上", previewPage.querySelectorAll(".stage-fixture").length === 8);
  check("新场景出现在静态预览列表", previewPage.textContent?.includes("开场暖场 2") ?? false);

  console.log(failures === 0 ? "\nUI 冒烟测试通过。" : `\n${failures} 项失败。`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
