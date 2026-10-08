/**
 * dom-probe-scan.mjs —— **全变体** DOM 契约扫描（把 `dom-probe.mjs` 的判据铺满矩阵）。
 *
 * ── 为什么需要它 ────────────────────────────────────────────────────────────
 *
 * `dom-probe.mjs` 一次只对一个 component/variant。首轮（2026-10-08）只扫了
 * **72 个组件的首变体**，就在 8 个组件上抓到了 L6（像素）与 L4（jsdom SSR）
 * 都测不到的结构/ARIA 分叉 —— 说明「只扫首变体」的覆盖率是不够的。
 *
 * 本扫描器铺满 matrix 的 **379 个 component/variant 组合**（desktop 一档；
 * 结构与视口无关，视口只改盒子尺寸），**复用** dom-probe 的
 * `startServer / dumpStage / normalizePrefix / contractsOfPair`
 * ⇒ 与单次探针、L4 契约是**同一套判据**（PITFALLS 353 同判：判据只能一个来源）。
 *
 * ── 用法 ────────────────────────────────────────────────────────────────────
 *
 * ```sh
 * # 先确保 props.artifacts 是最新的：node tests/visual/build.mjs 的 buildAll（绝对路径）
 * node tests/visual/dom-probe-scan.mjs                 # 全量 379 组
 * node tests/visual/dom-probe-scan.mjs --component tabs   # 单组件
 * node tests/visual/dom-probe-scan.mjs --out /tmp/scan.json
 * ```
 *
 * 退出码：0 = 全部一致（或只有已登记豁免）；1 = 存在未登记差异。
 *
 * ⚠️ 耗时：每组约 4–6s（页面加载 + 1.1s 相位等待）⇒ 全量约 30 分钟。
 *    与 dom-probe 逐次启动浏览器相比，这里**只启动一次**浏览器（省掉 379 次冷启动）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { contractsOfPair, dumpStage, startServer } from './dom-probe.mjs';
import { buildCases } from './matrix.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.resolve(HERE, '.artifacts');

const argv = process.argv.slice(2);
const optOf = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const componentFilter = optOf('component');
const outPath = optOf('out') ?? path.resolve(HERE, '.artifacts/dom-scan.json');

/**
 * 已登记（INTENDED / UPSTREAM / PLATFORM）的差异 —— 扫描器只提示，不算失败。
 *
 * 键可以是 **组件名**（该组件全部变体）或 **`组件/变体`**（只豁免这一个）。
 * ⚠️ 每加一条都要写清**编号 + 为什么改不动**，否则这份清单会退化成「免罚牌」。
 */
const ACCEPTED = new Set([
  // U15：本仓溢出触发器走本仓 Dropdown（自带 -trigger 类），antd 用 rc 级 dropdown
  'tabs',
  // 同上：Card 里嵌 Tabs 时同样多一个 -dropdown-trigger 类
  'card/tabs',
  // D113：antd 的 Button 根不落 icon-only（React 空子节点计数怪癖）
  'float-button',
  // ARIA_LABEL：transfer 的复选框 aria-label 是本仓**有意**的无障碍增强
  'transfer',
  // tour 的 placeholder 内联渲染（rc 走 Portal），Tour.ts 头部已记载
  'tour',
  // D112：cascader 外壳类名用 cascader 前缀重命名（antd 是 select+cascader 双前缀）
  'cascader',
  // D26：ConfigProvider 传 `theme` 时插一个 `display:contents` 作用域元素承载
  //      `--apollo-*`（零运行时 CSS 的必要代价）—— 比 antd 多一层 div
  'config-provider',
  // 裁决：Vue 侧根别名统一用原生 `class` / `style`（不再有 rootClassName prop，
  //      有 `@ts-expect-error` 类型测试钉住）⇒ React-only 的 rootClassName 不落
  'affix/class',
  // BodyGrid 差异 #1：虚拟表体用`@apollo-design/virtual-list` 的**原生滚动条**，
  // 不产 antd 那套 `tbody-virtual-scrollbar` 自绘滚动条
  'table/virtual',
]);

async function main() {
  if (!fs.existsSync(ARTIFACTS)) {
    console.error(`找不到 ${path.relative(process.cwd(), ARTIFACTS)} —— 先构建视觉产物。`);
    return 2;
  }

  const all = buildCases({ ...(componentFilter ? { component: componentFilter } : {}) });
  // 去重：只留 desktop 一档（契约结构与视口无关）
  const seen = new Set();
  const cases = [];
  for (const c of all) {
    if (c.viewport !== 'desktop') continue;
    const key = `${c.component}/${c.variant}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cases.push(c);
  }

  const { JSDOM } = await import('jsdom');
  globalThis.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
  const { contractOf } = await import('../../packages/test-utils/dist/index.mjs');

  const { server, port } = await startServer(ARTIFACTS);
  const browser = await chromium.launch();

  const results = [];
  try {
    for (const [i, c] of cases.entries()) {
      try {
        const react = await dumpStage(browser, {
          port,
          side: 'react',
          component: c.component,
          variant: c.variant,
          theme: c.theme,
        });
        const vue = await dumpStage(browser, {
          port,
          side: 'vue',
          component: c.component,
          variant: c.variant,
          theme: c.theme,
        });
        const { react: a, vue: b } = await contractsOfPair({
          contractOf,
          reactHtml: react.html,
          vueHtml: vue.html,
        });
        const sa = JSON.stringify(a);
        const sb = JSON.stringify(b);
        const key = `${c.component}/${c.variant}`;
        results.push({
          component: c.component,
          variant: c.variant,
          ok: sa === sb,
          accepted: ACCEPTED.has(key) || ACCEPTED.has(c.component),
          errors: [...react.errors.slice(0, 2), ...vue.errors.slice(0, 2)],
          diff: sa === sb ? null : diffLines(a, b),
        });
      } catch (e) {
        results.push({
          component: c.component,
          variant: c.variant,
          ok: false,
          accepted: false,
          error: String(e?.message ?? e).slice(0, 300),
        });
      }
      if ((i + 1) % 20 === 0 || i === cases.length - 1) {
        console.log(`  … ${i + 1}/${cases.length}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  const bad = results.filter((r) => !r.ok && !r.accepted);
  const acceptedBad = results.filter((r) => !r.ok && r.accepted);
  const errored = results.filter((r) => r.error);

  console.log(`\n▶ DOM 全变体扫描：${results.length} 组`);
  console.log(`  ✔ 一致：${results.filter((r) => r.ok).length}`);
  console.log(`  ⚠️ 已登记豁免（不视为失败）：${acceptedBad.length}`);
  console.log(`  ❌ 未登记差异：${bad.length}`);
  if (errored.length > 0) console.log(`  🚨 渲染期异常：${errored.length}`);

  for (const r of bad) {
    console.log(`\n❌ ${r.component}/${r.variant}`);
    if (r.error) console.log(`   error: ${r.error}`);
    for (const line of (r.diff ?? []).slice(0, 12)) console.log(`   ${line}`);
  }
  for (const r of errored) console.log(`\n🚨 异常 ${r.component}/${r.variant}: ${r.error}`);

  console.log(`\n明细：${outPath}`);
  return bad.length > 0 ? 1 : 0;
}

/** 与 dom-probe 的逐行 diff 同款输出（最多 12 行，够定位）。 */
function diffLines(a, b) {
  const sa = JSON.stringify(a, null, 1).split('\n');
  const sb = JSON.stringify(b, null, 1).split('\n');
  const max = Math.max(sa.length, sb.length);
  const out = [];
  let shown = 0;
  for (let i = 0; i < max && shown < 12; i += 1) {
    if (sa[i] !== sb[i]) {
      out.push(`- ${(sa[i] ?? '<缺>').trim()}`);
      out.push(`+ ${(sb[i] ?? '<缺>').trim()}`);
      shown += 1;
    }
  }
  return out;
}

process.exitCode = await main();
