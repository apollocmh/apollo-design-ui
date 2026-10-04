#!/usr/bin/env node
/**
 * run.mjs — L6 视觉回归入口（`pnpm test:visual`）。
 *
 * 流程：打包两侧 → 起静态服务器 → Playwright 截图 → pixelmatch 比对 → HTML 报告。
 *
 * ── 三种模式 ────────────────────────────────────────────────────────────────
 *
 * | 模式 | 渲染 React | 渲染 Vue | 用途 |
 * |---|---|---|---|
 * | `both`（默认） | ✅ | ✅ | 本机验证：两侧同机同时渲染，最可信 |
 * | `baseline`     | ✅ | — | 生成/更新 React 基线（入库，裁决 `visual-baseline-in-git` = A） |
 * | `compare`      | — | ✅ | 日常/CI：只渲染 Vue，与入库的 React 基线比对 |
 *
 * ── 必须防的假绿 ────────────────────────────────────────────────────────────
 *
 * 如果两侧都渲染失败（白屏、JS 报错），两张空白图逐像素**完全一致**，差异率 0% ——
 * 按阈值会判 PASS。所以这里强制捕获 `pageerror` / `console.error`：任一侧出错，
 * 该 case 直接判 FAIL（`reason: 'render-error'`），根本不走像素比对。
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAll } from './build.mjs';
import { comparePair, MAX_DIFF_RATIO } from './compare.mjs';
import { buildCases, COMPONENTS } from './matrix.mjs';
import { writeReport } from './report.mjs';
import { launchBrowser, newStablePage, screenshotElement, stabilizePage } from './stabilize.mjs';

/**
 * 🚨 基线自检：**同一组件的两个变体不得逐字节相同**（除非在 `matrix.mjs` 里显式登记）。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * 「变体空转」是本仓最容易悄悄发生的假绿：状态没被触发 / CSS 被压掉 /
 * 差异只存在于**属性**里（截图上不可见）时，两张 PNG 会**逐字节相同**，
 * 而 `compare` 照样给出 `exact` —— 看起来「测到了」，实际一格没测。
 *
 * 2026-10-01 实测：
 *   - `breadcrumb` 的 `with-params` 与 `basic` 同哈希（只差 `href`，而 href 是属性）；
 *   - 另有 **8 个组件 15 组**重复（多数是「静态帧天生测不到」，少数是用例构造问题）。
 *
 * ── 怎么登记「确实该相同」的 ──────────────────────────────────────────────────
 *
 * 在 `matrix.mjs` 的组件条目里加：
 *
 *   duplicateAllow: [{ variants: ['a', 'b'], reason: '为什么它们必然相同' }]
 *
 * ⚠️ 允许项必须**恰好命中**（多一条都不行）—— 与 L4 契约的 `allow` 同判，
 * 否则「允许」会变成永久的遮羞布。
 */
function checkBaselineDuplicates(names) {
  const problems = [];
  let checked = 0;
  for (const name of names) {
    const def = COMPONENTS[name];
    if (!def) continue;
    const dir = path.join(BASELINES, 'react', name);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
    // variant → 该 variant 全部 PNG 的哈希（按 viewport 分组比对，避免跨视口误判）
    const byViewport = new Map();
    for (const f of files) {
      const [variant, , viewport] = f.replace('.png', '').split('__');
      if (!def.variants.includes(variant)) continue;
      const key = `${viewport}`;
      if (!byViewport.has(key)) byViewport.set(key, new Map());
      const hash = crypto
        .createHash('md5')
        .update(fs.readFileSync(path.join(dir, f)))
        .digest('hex');
      const group = byViewport.get(key);
      if (!group.has(hash)) group.set(hash, new Set());
      group.get(hash).add(variant);
    }
    const allow = def.duplicateAllow ?? [];
    const used = new Set();
    for (const [viewport, group] of byViewport) {
      for (const [, variants] of group) {
        if (variants.size < 2) continue;
        checked += 1;
        const sorted = [...variants].sort();
        const idx = allow.findIndex((a) => [...a.variants].sort().join('|') === sorted.join('|'));
        if (idx < 0) {
          problems.push(
            `${name}/${viewport}：${sorted.join(' == ')} 逐字节相同（未登记）` +
              ' —— 变体是空转的？要么让它产生可见差异，要么在 matrix.mjs 里登记 duplicateAllow',
          );
        } else {
          used.add(idx);
        }
      }
    }
    allow.forEach((a, i) => {
      if (!used.has(i)) {
        problems.push(
          `${name}：duplicateAllow 里的 [${a.variants.join(', ')}] **没有命中**任何重复` +
            ' —— 该豁免已失效（变体已产生差异或基线已更新），请删掉它',
        );
      }
    });
  }
  return { problems, checked };
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(HERE, '.artifacts');
const SNAPSHOTS = path.join(HERE, 'snapshots');
const BASELINES = path.join(HERE, 'baselines');
const DIFF_DIR = path.join(HERE, 'diff');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function parseArgs(argv) {
  const args = {
    component: null,
    variant: null,
    viewport: null,
    mode: 'both',
    noBuild: false,
    checkBaselines: false,
    shard: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--check-baselines') args.checkBaselines = true;
    else if (a === '--component') args.component = argv[++i];
    else if (a === '--variant') args.variant = argv[++i];
    else if (a === '--viewport') args.viewport = argv[++i];
    else if (a === '--mode') args.mode = argv[++i];
    else if (a === '--no-build') args.noBuild = true;
    else if (a === '--shard') args.shard = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

/** 极简静态服务器：ES module 在 file:// 下会被 CORS 拦，必须走 http。 */
function startServer(root) {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);

    // 目录穿越防护
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * 渲染并截图一侧。
 * @returns {Promise<{path: string, errors: string[]}>}
 */
async function capture(browser, { port, side }, c, outFile) {
  const { context, page } = await newStablePage(browser, { width: c.width, height: c.height });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });

  try {
    const q = new URLSearchParams({
      component: c.component,
      variant: c.variant,
      theme: c.theme,
    });
    const url = `http://127.0.0.1:${port}/${side}/${side}.html?${q.toString()}`;

    await page.goto(url, { waitUntil: 'load' });
    // 等渲染完成的标志，不用 sleep（TESTING.md A3）
    await page.waitForFunction('window.__VISUAL_READY__ === true', null, { timeout: 20000 });
    await stabilizePage(page);

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await screenshotElement(page, '#stage', outFile);
    return { path: outFile, errors };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`用法: node tests/visual/run.mjs [选项]

  --check-baselines    只跑「基线重复自检」（不开浏览器，秒级；CI 可用）
  --component <name>   只跑某个组件（默认跑 matrix 里登记的全部）
  --variant <name>     只跑某个用例
  --viewport <id>      只跑某个 viewport（mobile / tablet / desktop）
  --mode <mode>        both（默认）| baseline | compare
  --no-build           跳过 vite 打包，沿用上次的 .artifacts
  --shard <i>/<n>      只跑第 i 份（共 n 份）。**按 case 下标取模**划分 ⇒ 确定性、
                       完整覆盖、无重复、无遗漏（供 GitHub Actions matrix 并行用）。
`);
    return 0;
  }

  // `--check-baselines`：只跑基线自检（不开浏览器、不构建）—— CI 可单独跑，秒级。
  if (args.checkBaselines) {
    const names = args.component ? [args.component] : Object.keys(COMPONENTS);
    const dup = checkBaselineDuplicates(names);
    if (dup.problems.length > 0) {
      console.log('🚨 基线自检失败：');
      for (const p of dup.problems) console.log(`  - ${p}`);
      return 1;
    }
    console.log(`✅ 基线自检通过（${names.length} 个组件 / ${dup.checked} 组重复，均有登记）`);
    return 0;
  }

  if (!['both', 'baseline', 'compare'].includes(args.mode)) {
    console.error(`未知模式：${args.mode}（可选 both / baseline / compare）`);
    return 2;
  }

  if (!args.noBuild) {
    console.log('▶ 打包两侧渲染入口…');
    await buildAll(ARTIFACTS);
    console.log('  ✔ 完成');
  }

  // `--shard i/n`：只跑 1/n 的 case（GitHub Actions matrix 并行用）。
  //
  // ⚠️ 划分方式是**按 case 下标取模**，不是「按组件分组」：
  //    case 列表由 `matrix.mjs` 确定性生成 ⇒ 取模是**确定性划分**（同输入永远同分片），
  //    且天然满足「完整覆盖 / 无重复 / 无遗漏」（这一点由 `shard.test.ts` 的断言钉住）。
  let shardIndex = 1;
  let shardCount = 1;
  if (args.shard !== null) {
    const m = /^([1-9]\d*)\/([1-9]\d*)$/.exec(args.shard);
    if (!m || Number(m[1]) > Number(m[2])) {
      console.error(`--shard 的格式应为 i/n（1<=i<=n），收到：${args.shard}`);
      return 2;
    }
    shardIndex = Number(m[1]);
    shardCount = Number(m[2]);
  }

  const allCases = buildCases({
    component: args.component,
    variants: args.variant ? [args.variant] : undefined,
  }).filter((c) => !args.viewport || c.viewport === args.viewport);

  const cases =
    shardCount > 1 ? allCases.filter((_, i) => i % shardCount === shardIndex - 1) : allCases;

  if (cases.length === 0) {
    console.error('没有匹配的 case。');
    return 2;
  }

  const sides =
    args.mode === 'baseline' ? ['react'] : args.mode === 'compare' ? ['vue'] : ['react', 'vue'];

  console.log(
    `▶ 渲染 ${cases.length} 组 × [${sides.join(', ')}]` +
      (shardCount > 1 ? `  （shard ${shardIndex}/${shardCount}，全部 ${allCases.length} 组）` : ''),
  );
  const { server, port } = await startServer(ARTIFACTS);
  const { browser, channel } = await launchBrowser();
  console.log(`  浏览器：${channel}`);

  const results = [];
  try {
    for (const c of cases) {
      const file = `${c.variant}__${c.theme}__${c.viewport}.png`;
      const rel = `${c.component}/${file}`;

      // React 侧：baseline 模式下写入 baselines/（入库），否则写 snapshots/
      const reactOut =
        args.mode === 'baseline'
          ? path.join(BASELINES, 'react', rel)
          : path.join(SNAPSHOTS, 'react', rel);
      // Vue 侧始终写 snapshots/
      const vueOut = path.join(SNAPSHOTS, 'vue', rel);
      // compare 模式下，React 侧的参照是入库基线
      const reactRef = args.mode === 'compare' ? path.join(BASELINES, 'react', rel) : reactOut;

      const errors = [];

      if (sides.includes('react')) {
        const r = await capture(browser, { port, side: 'react' }, c, reactOut);
        errors.push(...r.errors);
      }
      if (sides.includes('vue')) {
        const r = await capture(browser, { port, side: 'vue' }, c, vueOut);
        errors.push(...r.errors);
      }

      const base = {
        id: c.id,
        component: c.component,
        variant: c.variant,
        viewport: c.viewport,
        width: c.width,
        height: c.height,
        relReact: path.relative(HERE, reactRef).split(path.sep).join('/'),
        relVue: path.relative(HERE, vueOut).split(path.sep).join('/'),
        relDiff: path.relative(HERE, path.join(DIFF_DIR, rel)).split(path.sep).join('/'),
      };

      if (errors.length > 0) {
        results.push({
          ...base,
          verdict: 'FAIL',
          reason: 'render-error',
          message: `渲染期报错（${`${sides.join('/')}侧`}）—— 不比像素，因为「两侧都白屏」会得到 0% 差异而假绿：${errors.slice(0, 3).join(' | ')}`,
        });
        console.log(`  ✗ ${c.id}  渲染错误`);
        continue;
      }

      if (args.mode === 'baseline') {
        results.push({
          ...base,
          verdict: 'BASELINE',
          reason: 'written',
          message: '已写入 React 基线。',
        });
        console.log(`  • ${c.id}  基线已写入`);
        continue;
      }

      const cmp = await comparePair(reactRef, vueOut, path.join(DIFF_DIR, rel));
      results.push({ ...base, ...cmp });
      console.log(
        `  ${cmp.verdict === 'PASS' ? '✔' : '✗'} ${c.id}  ${(cmp.diffRatio * 100).toFixed(3)}%  ${cmp.reason}`,
      );
    }
  } finally {
    await browser.close();
    server.close();
  }

  // ---- 基线自检（不需要浏览器，两种模式都跑）----
  const dup = checkBaselineDuplicates(args.component ? [args.component] : Object.keys(COMPONENTS));
  if (dup.problems.length > 0) {
    console.log('\n🚨 基线自检失败：');
    for (const p of dup.problems) console.log(`  - ${p}`);
  } else {
    console.log(`\n✅ 基线自检通过（${dup.checked} 组重复，均有登记）`);
  }

  const compared = results.filter((r) => r.verdict !== 'BASELINE');
  const failed = compared.filter((r) => r.verdict === 'FAIL');

  const { file: reportFile } = writeReport({
    outDir: HERE,
    results,
    // ⚠️ shard 并行时报告名必须各自不同，否则 4 个 shard 会互相覆盖
    fileName: shardCount > 1 ? `report-${shardIndex}-of-${shardCount}.html` : 'report.html',
    meta: {
      component: args.component ?? Object.keys(COMPONENTS).join(', '),
      mode: args.mode,
      browser: channel,
      antdVersion: '6.6.4',
      timestamp: new Date().toISOString(),
      maxDiffRatio: MAX_DIFF_RATIO,
      shard: shardCount > 1 ? `${shardIndex}/${shardCount}` : null,
    },
  });

  console.log(`\n报告：${path.relative(process.cwd(), reportFile)}`);
  console.log(`通过 ${compared.length - failed.length} / ${compared.length}`);

  if (failed.length > 0) {
    console.log('\n失败项（必须人工分类后记入 COMPATIBILITY.md）：');
    for (const f of failed) console.log(`  - ${f.id}  [${f.reason}] ${f.message}`);
    return 1;
  }
  if (dup.problems.length > 0) return 1;
  return 0;
}

process.exitCode = await main();
