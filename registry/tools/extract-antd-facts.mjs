#!/usr/bin/env node

/**
 * extract-antd-facts.mjs
 *
 * 从 Ant Design 的 npm 产物中提取「事实」，产出 registry/source/antd-<version>.raw.json。
 *
 * 为什么需要这个脚本：
 *   - AGENTS.md 规定「禁止凭记忆描述 Ant Design 的行为」。所有关于 antd 的断言
 *     （组件清单、rc 依赖、Token 数量、内部依赖 DAG）必须来自可复现的提取过程。
 *   - 升级 antd 目标版本时，重跑本脚本 + review diff 即可获得准确的变更影响面。
 *
 * 用法：
 *   node registry/tools/extract-antd-facts.mjs --artifact /path/to/antd/package
 *   node registry/tools/extract-antd-facts.mjs --download          # 自动下载 latest
 *   node registry/tools/extract-antd-facts.mjs --version 6.6.4     # 下载指定版本
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SOURCE_DIR = path.join(ROOT, 'registry/source');

/** antd 中属于「基础设施」而非「组件」的目录 */
const INFRA_DIRS = new Set(['_util', 'locale', 'style', 'theme', 'version']);

/** 别名目录：内容等同另一个组件 */
const ALIAS_DIRS = {
  qrcode: 'qr-code',
  row: 'grid',
  col: 'grid',
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { artifact: null, download: false, version: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--artifact') args.artifact = argv[++i];
    else if (a === '--download') args.download = true;
    else if (a === '--version') args.version = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: extract-antd-facts.mjs [--artifact <path>] [--download] [--version <v>]');
      process.exit(0);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// 下载 antd 产物（npm tarball）
// ---------------------------------------------------------------------------
function downloadArtifact(version) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'antd-facts-'));
  const pkgSpec = version ? `antd@${version}` : 'antd';
  console.log(`[extract] downloading ${pkgSpec} via npm pack ...`);
  execFileSync('npm', ['pack', pkgSpec, '--silent'], { cwd: tmp, stdio: 'inherit' });
  const tgz = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack produced no tarball');
  execFileSync('tar', ['xzf', path.join(tmp, tgz)], { cwd: tmp });
  return path.join(tmp, 'package');
}

// ---------------------------------------------------------------------------
// 提取
// ---------------------------------------------------------------------------
function listDirs(p) {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** 递归收集目录下的 js / d.ts 文件 */
function collectFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) collectFiles(fp, out);
    else if (/\.(js|d\.ts)$/.test(e.name)) out.push(fp);
  }
  return out;
}

/**
 * 建立「interface 名 → { extends, props }」的全局索引。
 *
 * 为什么必须递归解析 extends：
 *   antd 的 token 类型是分层继承的，例如
 *     ColorMapToken extends ColorNeutralMapToken, ColorPrimaryMapToken, ...
 *   只读单个 interface 的字段会严重低估 token 数量（实测 colors 会从 76 变成 2）。
 */
function buildInterfaceIndex(dir) {
  const index = new Map();
  const files = collectFiles(dir).filter((f) => f.endsWith('.d.ts'));
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    // 匹配 `[export] interface Name<...> extends A, B { ... }`。
    // 注意：antd 产物中部分 interface 没有 export 前缀（如 ColorPrimaryMapToken），
    // 所以 export 必须可选，否则会漏掉整条继承链上的 token。
    const re =
      /(?:export\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)\s*(<[^{]*?>)?\s*(?:extends\s+([^{]*?))?\s*\{([\s\S]*?)\n\}/g;
    for (const m of text.matchAll(re)) {
      const name = m[1];
      const extRaw = m[3] ?? '';
      const extendsList = extRaw
        .split(',')
        .map((s) =>
          s
            .trim()
            .replace(/<[^>]*>/g, '')
            .trim(),
        )
        .filter((s) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s));
      const props = [...m[4].matchAll(/^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*[?:]/gm)].map((x) => x[1]);
      index.set(name, { extends: extendsList, props, file: path.relative(dir, file) });
    }
  }
  return index;
}

/** 递归解析某个 interface 的全部字段（含继承链），带环检测 */
function resolveInterface(index, name, seen = new Set()) {
  if (!index.has(name) || seen.has(name)) return { props: [], missing: !index.has(name) };
  seen.add(name);
  const node = index.get(name);
  const props = new Set(node.props);
  const missing = [];
  for (const parent of node.extends) {
    const r = resolveInterface(index, parent, seen);
    for (const p of r.props) props.add(p);
    if (r.missing) missing.push(parent);
  }
  return { props: [...props], missing: missing.length > 0, missingNames: missing };
}

function extractFacts(artifactDir, esDir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(artifactDir, 'package.json'), 'utf8'));
  const dirs = listDirs(esDir);
  const componentDirs = dirs.filter((d) => !INFRA_DIRS.has(d));

  const components = {};
  for (const dir of componentDirs) {
    const files = collectFiles(path.join(esDir, dir));
    const rcDeps = new Set();
    const antdEcoDeps = new Set();
    // 区分运行时依赖与纯类型依赖 —— 这是 DAG 正确性的关键：
    //   tooltip 的 .d.ts 引用了 table 的类型，但运行时并不 import table。
    //   若不区分，DAG 会出现 tooltip ↔ table、message ↔ app 这类假环。
    const internalRuntime = new Set();
    const internalType = new Set();
    // 叶子模块依赖：`../table/TableMeasureRowContext`、`../form/validateMessagesContext`、
    // `../color-picker/util` 这类导入指向的是**无组件语义的共享叶子模块**，不是组件本身。
    // 把它们误判为组件级依赖会在 DAG 中制造出大量假环
    // （antd 自身就有 config-provider ↔ form、tooltip ↔ table 的假环）。
    // 我们的架构对策：把这些共享 context / util 提取到 ui/src/_internal/ 叶子模块。
    const internalLeaf = new Set();
    let lineCount = 0;

    for (const f of files) {
      let text;
      try {
        text = fs.readFileSync(f, 'utf8');
      } catch {
        continue;
      }
      const isTypeFile = f.endsWith('.d.ts');
      if (f.endsWith('.js')) lineCount += text.split('\n').length;

      for (const m of text.matchAll(
        /from\s+["'](@rc-component\/[^"']+|rc-[^"']+|@ant-design\/[^"']+)["']/g,
      )) {
        const spec = m[1];
        if (spec.startsWith('@rc-component/') || spec.startsWith('rc-')) {
          // 只保留包名（去掉 /generate/dayjs、/locale/zh_CN 之类的子路径）
          const parts = spec.split('/');
          const pkgName = spec.startsWith('@rc-component/') ? `${parts[0]}/${parts[1]}` : parts[0];
          rcDeps.add(pkgName);
        } else {
          const parts = spec.split('/');
          antdEcoDeps.add(spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]);
        }
      }

      // 捕获 `import [type] ... from '../<comp>[/<subpath>]'`
      const importRe =
        /import\s+(type\s+)?(?:\{[^}]*\}|[A-Za-z_$][\w$]*|\*\s+as\s+[\w$]+)\s+from\s+["']\.\.\/([a-z0-9-]+)(\/[^"']*)?["']/g;
      for (const m of text.matchAll(importRe)) {
        const isTypeOnly = Boolean(m[1]) || isTypeFile;
        const dep = m[2];
        const subPath = m[3] ?? '';
        if (INFRA_DIRS.has(dep) || !componentDirs.includes(dep)) continue;

        // `../x` 或 `../x/index` → 组件级依赖；`../x/y` → 叶子模块依赖
        const isComponentLevel = subPath === '' || subPath === '/index';
        if (!isComponentLevel) {
          if (!isTypeOnly) internalLeaf.add(`${dep}${subPath}`);
          continue;
        }
        if (isTypeOnly) internalType.add(dep);
        else internalRuntime.add(dep);
      }
    }

    // 纯类型依赖不计入运行时 DAG，避免假环
    for (const t of internalType) if (internalRuntime.has(t)) internalType.delete(t);

    components[dir] = {
      rcDeps: [...rcDeps].sort(),
      antdEcoDeps: [...antdEcoDeps].sort(),
      internalDepsRuntime: [...internalRuntime].sort(),
      internalDepsType: [...internalType].sort(),
      internalDepsLeaf: [...internalLeaf].sort(),
      fileCount: files.length,
      buildLineCount: lineCount,
      aliasOf: ALIAS_DIRS[dir] ?? null,
    };
  }

  // 反向索引：rc 包 → 使用它的组件
  const rcUsedBy = {};
  for (const [name, info] of Object.entries(components)) {
    for (const rc of info.rcDeps) (rcUsedBy[rc] ??= []).push(name);
  }
  for (const k of Object.keys(rcUsedBy)) rcUsedBy[k].sort();

  // 反向索引：组件被谁依赖（仅运行时依赖构成 DAG）
  const dependedBy = {};
  for (const [name, info] of Object.entries(components)) {
    for (const dep of info.internalDepsRuntime) (dependedBy[dep] ??= []).push(name);
  }
  for (const k of Object.keys(dependedBy)) dependedBy[k].sort();

  // Token 事实（含继承链递归解析）
  const ifaceDir = path.join(esDir, 'theme/interface');
  const ifaceIndex = buildInterfaceIndex(ifaceDir);
  const resolve = (name) => resolveInterface(ifaceIndex, name).props;

  const tokens = {
    seed: resolve('SeedToken'),
    map: {
      // MapToken 是聚合接口（extends ColorMapToken, CommonMapToken, FontMapToken,
      // HeightMapToken, SizeMapToken, StyleMapToken）。它是「Map Token 总数」的权威口径。
      aggregate: resolve('MapToken'),
      colors: resolve('ColorMapToken'),
      font: resolve('FontMapToken'),
      height: resolve('HeightMapToken'),
      size: resolve('SizeMapToken'),
      style: resolve('StyleMapToken'),
    },
    alias: resolve('AliasToken'),
    componentGroups: resolve('ComponentTokenMap'),
  };

  // 每个组件自己的 Component Token（用于 tokens.json 的组件级清单）。
  // antd 把 ComponentToken 声明放在两个位置：少数在 style/token.d.ts，多数在 style/index.d.ts。
  const componentTokens = {};
  for (const dir of componentDirs) {
    const candidates = [
      path.join(esDir, dir, 'style/token.d.ts'),
      path.join(esDir, dir, 'style/index.d.ts'),
    ].filter((f) => fs.existsSync(f));
    if (candidates.length === 0) continue;

    const props = new Set();
    for (const file of candidates) {
      const text = fs.readFileSync(file, 'utf8');
      const m = text.match(/(?:export\s+)?interface\s+ComponentToken\b[^{]*\{([\s\S]*?)\n\}/);
      if (!m) continue;
      for (const p of m[1].matchAll(/^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*[?:]/gm)) {
        props.add(p[1]);
      }
    }
    if (props.size) componentTokens[dir] = [...props];
  }

  // locale
  const localeDir = path.join(esDir, 'locale');
  const locales = fs.existsSync(localeDir)
    ? fs
        .readdirSync(localeDir)
        .filter((f) => f.endsWith('.js') && f !== 'index.js')
        .map((f) => f.replace(/\.js$/, ''))
        .sort()
    : [];

  // 数量统计
  const ownAlias = ifaceIndex.get('AliasToken')?.props ?? [];
  const stats = {
    'token.seed': tokens.seed.length,
    'token.map.aggregate': tokens.map.aggregate.length,
    'token.map.colors': tokens.map.colors.length,
    'token.map.font': tokens.map.font.length,
    'token.map.height': tokens.map.height.length,
    'token.map.size': tokens.map.size.length,
    'token.map.style': tokens.map.style.length,
    // AliasToken 通过 extends 包含全部 MapToken，所以「有效字段数」远大于「自身声明数」。
    // 两个数字都有意义：own 说明 antd 额外定义了多少语义别名，
    // effective 说明用户通过 theme.token 实际可覆盖的字段总量。
    'token.alias.own': ownAlias.length,
    'token.alias.effective': tokens.alias.length,
    'token.componentGroups': tokens.componentGroups.length,
    'componentTokens.total': Object.values(componentTokens).reduce((a, b) => a + b.length, 0),
    'componentTokens.components': Object.keys(componentTokens).length,
  };

  return {
    $comment:
      'GENERATED by registry/tools/extract-antd-facts.mjs — do not edit by hand. ' +
      'This file is the reproducible evidence for every claim we make about Ant Design.',
    antdVersion: pkg.version,
    extractedAt: new Date().toISOString(),
    peerDependencies: pkg.peerDependencies ?? {},
    runtimeDependencies: pkg.dependencies ?? {},
    dependencyCount: Object.keys(pkg.dependencies ?? {}).length,
    componentDirs,
    components,
    rcUsedBy,
    dependedBy,
    tokens,
    componentTokens,
    tokenStats: stats,
    localeCount: locales.length,
    locales,
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
let artifactDir = args.artifact;

if (!artifactDir) {
  artifactDir = downloadArtifact(args.version);
} else if (!fs.existsSync(path.join(artifactDir, 'package.json'))) {
  throw new Error(`--artifact ${artifactDir} does not look like an antd package dir`);
}

const esDir = path.join(artifactDir, 'es');
if (!fs.existsSync(esDir)) throw new Error(`no es/ directory in ${artifactDir}`);

const facts = extractFacts(artifactDir, esDir);
fs.mkdirSync(SOURCE_DIR, { recursive: true });
const outFile = path.join(SOURCE_DIR, `antd-${facts.antdVersion}.raw.json`);
fs.writeFileSync(outFile, `${JSON.stringify(facts, null, 2)}\n`);

console.log(`[extract] antd ${facts.antdVersion}`);
console.log(`[extract] component dirs: ${facts.componentDirs.length}`);
console.log(`[extract] runtime deps:   ${facts.dependencyCount}`);
console.log(`[extract] rc packages:    ${Object.keys(facts.rcUsedBy).length}`);
console.log(`[extract] locales:        ${facts.localeCount}`);
console.log(`[extract] token stats:    ${JSON.stringify(facts.tokenStats)}`);
console.log(`[extract] → ${path.relative(ROOT, outFile)}`);
