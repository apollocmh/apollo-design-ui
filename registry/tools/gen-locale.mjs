#!/usr/bin/env node
/**
 * gen-locale.mjs — 从 antd 的 locale 源生成 @apollo-design/locale 的 75 个语言包
 *
 * 为什么需要这个脚本：
 *   `@apollo-design/locale` 的 `notDo` 第三条就是「不手工编辑生成产物」。
 *   75 个语言包 × 每个约 120 行 ≈ 9000 行**纯数据**，手工维护既不可能，
 *   也会立刻与上游漂移。antd 自己也是从这套源生成的。
 *
 * 为什么是「求值」而不是「解析」：
 *   语言包不是纯 JSON —— 它 import 了 4 个分片（其中 2 个来自 rc 包），
 *   `es_US` 还会 `...esES` 展开另一个语言包。写正则会同时被模板字符串
 *   （`'${label}不是一个有效的${type}'`）、嵌套对象、以及**逐包不同的 import 集合**
 *   击穿（`es_US` 就没有 Pagination/TimePicker 的 import）。
 *   所以本脚本把三个来源的 ESM 原样拷进临时目录、重写 import 说明符、
 *   用 `await import()` **真的求值**，拿到对象再序列化。
 *   这样展开顺序、共享引用、计算属性全都自然正确，且不需要任何 JS 解析器。
 *
 * 为什么一个语言一个文件（而不是共享分片模块）：
 *   1. tree-shaking 天然成立 —— 消费方 import 一种语言只拉一个模块；
 *   2. 不需要「跨语言去重」这种会让重新生成不确定的启发式；
 *   3. **diff 稳定** —— rc 改了 `picker/common` 时只会影响真正用到它的那些语言文件，
 *      而不会让 68 个文件同时出现在 diff 里；
 *   4. 代价只是把几个很小的公共字段重复几十遍，而那是数据不是逻辑。
 *
 * rc 数据为什么要固化：
 *   `@rc-component/pagination` 与 `@rc-component/picker` **不在本仓库的依赖图里**
 *   （本包 `dependsOn: []`），而 `pnpm install` 在本沙箱会挂起（PITFALLS.md 第 7 条）。
 *   ⇒ `--sync-rc` 拉一次并固化到 `registry/source/locale-rc/`（带 provenance + sha256），
 *   日常生成与 `--check` 只读固化副本，**离线确定**。
 *
 * 用法：
 *   node registry/tools/gen-locale.mjs --sync-rc        # 拉取并固化 rc locale 数据
 *   node registry/tools/gen-locale.mjs                  # 生成到 packages/locale/src/
 *   node registry/tools/gen-locale.mjs --check          # 只比对，不写入（门禁）
 *   node registry/tools/gen-locale.mjs --antd <dir>     # 显式指定 antd 的 es 目录
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'packages/locale/src/locales');
const RC_DIR = path.join(ROOT, 'registry/source/locale-rc');
/**
 * 测试基线（oracle）。
 *
 * 它是**求值得到**的真实对象，测试拿它与生成产物做深比较 ——
 * 这样「73 个语言包逐字段与 antd 一致」不用靠人眼核对。
 * 与 icons 的 `tests/compat/baselines/icons.dom.json` 同一套路（该目录 biome 已忽略）。
 */
const BASELINE_FILE = path.join(ROOT, 'tests/compat/baselines/locale.json');

/** antd 的 locale 里这三个不是语言包 */
const NON_LANG_FILES = new Set(['index.js', 'context.js', 'useLocale.js']);

/**
 * rc 的锁定版本。**改这里等于换数据源**，必须同时跑 `--sync-rc` 并复核 diff。
 * 取值来自 antd 6.6.4 的 package.json（`~1.4.0` / `~1.12.2`）。
 */
const RC_PACKAGES = {
  pagination: { name: '@rc-component/pagination', version: '1.4.0' },
  picker: { name: '@rc-component/picker', version: '1.12.2' },
};

/** `--sync-rc` 时额外要拉的非语言文件（`picker` 的语言包 import 了它） */
const RC_EXTRA_FILES = { picker: ['common'] };

const args = { check: false, syncRc: false, antdDir: undefined, dump: undefined };
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--check') args.check = true;
  else if (a === '--sync-rc') args.syncRc = true;
  else if (a === '--antd') {
    args.antdDir = process.argv[i + 1];
    i += 1;
  } else if (a === '--dump') {
    args.dump = process.argv[i + 1];
    i += 1;
  }
}

// ---------------------------------------------------------------------------
// 定位 antd 的 es 目录
//
// 三级回退，从「最正规」到「本仓库的既有约定」：
//   1. --antd <dir>
//   2. packages/locale/node_modules/antd/es   （gen-icons 的那种正规做法）
//   3. /tmp/antd-src/package/es               （本项目读 antd 产物的既有位置）
// 都不在就报错退出，**不静默降级**。
// ---------------------------------------------------------------------------
function resolveAntdEs() {
  const candidates = [
    args.antdDir,
    path.join(ROOT, 'packages/locale/node_modules/antd/es'),
    '/tmp/antd-src/package/es',
  ].filter(Boolean);

  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, 'locale'))) {
      return dir;
    }
  }
  console.error(
    '[locale] 找不到 antd 的 es 目录。试过：\n' +
      candidates.map((c) => `  - ${c}`).join('\n') +
      '\n  用 --antd <dir> 显式指定，或先 `corepack pnpm install`。',
  );
  process.exit(1);
}

// `--sync-rc` 也要用它 —— 要拉的 rc 语言清单是从 antd 的语言包 import 里刮出来的
const ANTD_ES = resolveAntdEs();

/** antd 的版本，写进产物头与 provenance。 */
function readAntdVersion() {
  const pkg = path.join(path.dirname(ANTD_ES), 'package.json');
  if (!fs.existsSync(pkg)) return 'unknown';
  return JSON.parse(fs.readFileSync(pkg, 'utf8')).version;
}

// ---------------------------------------------------------------------------
// 语言清单
// ---------------------------------------------------------------------------
function listLanguages() {
  return fs
    .readdirSync(path.join(ANTD_ES, 'locale'))
    .filter((f) => f.endsWith('.js') && !NON_LANG_FILES.has(f))
    .map((f) => f.slice(0, -3))
    .sort();
}

/** 从 antd 的语言包里收集 rc 说明符（`--sync-rc` 用它决定要拉哪些）。 */
function collectRcSpecifiers(languages) {
  const needed = { pagination: new Set(), picker: new Set() };
  for (const lang of languages) {
    const dirs = ['locale', 'calendar/locale', 'date-picker/locale', 'time-picker/locale'];
    for (const dir of dirs) {
      const file = path.join(ANTD_ES, dir, `${lang}.js`);
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(
        /from\s+'@rc-component\/(pagination|picker)\/locale\/([^']+)'/g,
      )) {
        needed[m[1]].add(m[2]);
      }
    }
  }
  return needed;
}

// ---------------------------------------------------------------------------
// --sync-rc：拉取并固化
// ---------------------------------------------------------------------------
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} ← ${url}`);
  }
  return res.text();
}

async function syncRc() {
  const languages = listLanguages();
  const needed = collectRcSpecifiers(languages);
  const provenance = {
    note: '本目录是 gen-locale.mjs --sync-rc 固化的 rc locale 数据。不要手工编辑。',
    antdVersion: readAntdVersion(),
    packages: {},
  };

  for (const [key, pkg] of Object.entries(RC_PACKAGES)) {
    const outDir = path.join(RC_DIR, key);
    fs.mkdirSync(outDir, { recursive: true });

    const names = [...needed[key]].sort();
    const files = {};
    for (const name of [...names, ...(RC_EXTRA_FILES[key] ?? [])]) {
      const url = `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/es/locale/${name}.js`;
      const text = await fetchText(url);
      fs.writeFileSync(path.join(outDir, `${name}.js`), text);
      files[`${name}.js`] = createHash('sha256').update(text).digest('hex');
    }

    provenance.packages[key] = { name: pkg.name, version: pkg.version, files };
    console.log(`[locale] ${pkg.name}@${pkg.version} → ${Object.keys(files).length} 个文件`);
  }

  fs.writeFileSync(
    path.join(RC_DIR, 'provenance.json'),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
  console.log(`[locale] 固化完成 → ${path.relative(ROOT, RC_DIR)}`);
}

// ---------------------------------------------------------------------------
// 建临时树 + 重写说明符
//
// 为什么重写而不是用 loader：Node 的 ESM loader 需要额外进程参数，
// 而说明符重写是一次性的纯文本变换，可控且可断言（未知说明符直接抛错，
// 这样上游新增依赖时会**报错**而不是静默漏掉 —— 见契约文档 §9 第 2 条）。
// ---------------------------------------------------------------------------
function copyJsFiles(fromDir, toDir, exclude = new Set()) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const name of fs.readdirSync(fromDir)) {
    if (!name.endsWith('.js') || exclude.has(name)) continue;
    fs.copyFileSync(path.join(fromDir, name), path.join(toDir, name));
  }
}

function rewriteSpecifiers(tmpRoot, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const fileDir = path.dirname(filePath);

  // ⚠️ 引号两种都要匹配 —— antd 的产物用单引号，rc 的产物用双引号
  const next = src.replace(/from\s+(['"])([^'"]+)\1/g, (_all, _q, spec) => {
    let resolved;
    const rcPagination = '@rc-component/pagination/locale/';
    const rcPicker = '@rc-component/picker/locale/';

    if (spec.startsWith(rcPagination)) {
      resolved = path.join(tmpRoot, 'rc/pagination', `${spec.slice(rcPagination.length)}.js`);
    } else if (spec.startsWith(rcPicker)) {
      resolved = path.join(tmpRoot, 'rc/picker', `${spec.slice(rcPicker.length)}.js`);
    } else if (spec.startsWith('.')) {
      // 相对路径：ESM 要求显式扩展名
      resolved = path.resolve(fileDir, path.extname(spec) ? spec : `${spec}.js`);
    } else {
      throw new Error(
        `[locale] 未知的 import 说明符 "${spec}"（在 ${path.relative(tmpRoot, filePath)}）`,
      );
    }

    if (!fs.existsSync(resolved)) {
      throw new Error(
        `[locale] 解析不到 "${spec}" → ${resolved}\n` +
          '  上游改了依赖结构？先跑 --sync-rc，或检查契约文档 §3.3 的依赖链。',
      );
    }
    let rel = path.relative(fileDir, resolved);
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `from '${rel}'`;
  });

  fs.writeFileSync(filePath, next);
}

function buildTempTree() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-locale-'));
  // 临时目录里的 .js 必须是 ESM
  fs.writeFileSync(path.join(tmpRoot, 'package.json'), '{"type":"module"}\n');

  // ⚠️ 排除 index/context/useLocale —— 它们不是语言包，且 import react
  copyJsFiles(path.join(ANTD_ES, 'locale'), path.join(tmpRoot, 'antd/locale'), NON_LANG_FILES);
  copyJsFiles(path.join(ANTD_ES, 'calendar/locale'), path.join(tmpRoot, 'antd/calendar/locale'));
  copyJsFiles(
    path.join(ANTD_ES, 'date-picker/locale'),
    path.join(tmpRoot, 'antd/date-picker/locale'),
  );
  copyJsFiles(
    path.join(ANTD_ES, 'time-picker/locale'),
    path.join(tmpRoot, 'antd/time-picker/locale'),
  );

  for (const key of Object.keys(RC_PACKAGES)) {
    const src = path.join(RC_DIR, key);
    if (!fs.existsSync(src)) {
      throw new Error(`[locale] 缺少固化的 rc 数据 ${path.relative(ROOT, src)} —— 先跑 --sync-rc`);
    }
    copyJsFiles(src, path.join(tmpRoot, 'rc', key));
  }

  // 重写所有 .js 的说明符（antd 侧与 rc 侧都要）
  for (const sub of [
    'antd/locale',
    'antd/calendar/locale',
    'antd/date-picker/locale',
    'antd/time-picker/locale',
    'rc/pagination',
    'rc/picker',
  ]) {
    const dir = path.join(tmpRoot, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.js')) rewriteSpecifiers(tmpRoot, path.join(dir, name));
    }
  }

  return tmpRoot;
}

// ---------------------------------------------------------------------------
// 序列化
// ---------------------------------------------------------------------------

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function keyOf(key) {
  return IDENT_RE.test(key) ? key : quote(key);
}

/**
 * 找出 `Form.defaultValidateMessages.types` 里那个重复 13 次的字符串。
 *
 * 上游把它抽成包级常量 `typeTemplate`（`es/locale/zh_CN.js:5`），13 个 `types.*`
 * 都指向它。求值会把「共享引用」丢掉（字符串按值比较），所以这里按**形状**识别：
 * `types` 的 13 个值全等且是字符串 ⇒ 就是它。
 *
 * 这只是为了产物可读与 diff 稳定，**不影响运行时值**。
 */
function detectTypeTemplate(value) {
  const types = value?.Form?.defaultValidateMessages?.types;
  if (!types || typeof types !== 'object') return undefined;
  const values = Object.values(types);
  if (values.length < 2) return undefined;
  const first = values[0];
  if (typeof first !== 'string') return undefined;
  return values.every((v) => v === first) ? first : undefined;
}

function emitValue(value, indent, ctx) {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (typeof value === 'string') {
    if (ctx.typeTemplate !== undefined && value === ctx.typeTemplate) return 'typeTemplate';
    return quote(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => emitValue(v, indent + 1, ctx));
    const oneLine = `[${items.join(', ')}]`;
    // 全是短标量就单行，否则展开 —— 与上游的写法一致（`titles: ['', '']`）
    if (oneLine.length <= 80 && !oneLine.includes('\n')) return oneLine;
    return `[\n${items.map((s) => padInner + s).join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const body = entries
      .map(([k, v]) => `${padInner}${keyOf(k)}: ${emitValue(v, indent + 1, ctx)},`)
      .join('\n');
    return `{\n${body}\n${pad}}`;
  }
  throw new Error(`[locale] 不支持的值类型 ${typeof value}`);
}

/** 语言包的文件名（`zh_CN`）→ 导出名。保留原名，见契约文档 §6.1。 */
function exportName(lang) {
  return lang;
}

function generateLocaleFile(lang, value, antdVersion) {
  const typeTemplate = detectTypeTemplate(value);
  const ctx = { typeTemplate };

  const head = [
    '// 本文件由 registry/tools/gen-locale.mjs 生成，请勿手工修改。',
    `// 源：antd ${antdVersion} 的 es/locale/${lang}.js（含它 import 的 rc locale 分片）`,
    '// 重新生成：node registry/tools/gen-locale.mjs',
    '',
    "import type { Locale } from '../types';",
    '',
  ];

  if (typeTemplate !== undefined) {
    head.push(`const typeTemplate = ${quote(typeTemplate)};`, '');
  }

  const body = [
    `const localeValues: Locale = ${emitValue(value, 0, ctx)};`,
    '',
    'export default localeValues;',
    '',
  ];

  return [...head, ...body].join('\n');
}

function generateIndexFile(languages) {
  const lines = [
    '// 本文件由 registry/tools/gen-locale.mjs 生成，请勿手工修改。',
    '// 重新生成：node registry/tools/gen-locale.mjs',
    '',
  ];
  for (const lang of languages) {
    lines.push(`export { default as ${exportName(lang)} } from './${lang}';`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
async function main() {
  if (args.syncRc) {
    await syncRc();
    return;
  }

  const antdVersion = readAntdVersion();
  const languages = listLanguages();
  const tmpRoot = buildTempTree();

  const outputs = new Map();
  const dumped = {};
  for (const lang of languages) {
    const file = path.join(tmpRoot, 'antd/locale', `${lang}.js`);
    const mod = await import(pathToFileURL(file).href);
    if (!mod.default || typeof mod.default !== 'object') {
      throw new Error(`[locale] ${lang} 没有导出对象`);
    }
    dumped[lang] = mod.default;
    outputs.set(`${lang}.ts`, generateLocaleFile(lang, mod.default, antdVersion));
  }
  outputs.set('index.ts', generateIndexFile(languages));

  // --dump：把**求值得到**的真实对象写成 JSON。
  //   测试用它当 oracle —— 与生成产物做深比较，这样 73 个语言包不用靠人眼核对。
  // ⚠️ --check 只比对，**不写任何东西**（基线也不写）—— 检查不能改仓库
  if (!args.check) {
    const dumpPath = args.dump ? path.resolve(ROOT, args.dump) : BASELINE_FILE;
    fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
    fs.writeFileSync(dumpPath, `${JSON.stringify(dumped, null, 2)}\n`);
    console.log(`[locale] 快照 ${languages.length} 个语言包 → ${path.relative(ROOT, dumpPath)}`);
  }

  fs.rmSync(tmpRoot, { recursive: true, force: true });

  // 比对 / 写入
  let drift = 0;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of outputs) {
    const target = path.join(OUT_DIR, name);
    const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (existing === content) continue;
    if (args.check) {
      drift += 1;
      console.error(`[locale] ✗ ${path.relative(ROOT, target)} 与源不一致`);
    } else {
      fs.writeFileSync(target, content);
    }
  }

  // 清理已不存在的产物
  const expected = new Set(outputs.keys());
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.endsWith('.ts') && !expected.has(name)) {
      const target = path.join(OUT_DIR, name);
      if (args.check) {
        drift += 1;
        console.error(`[locale] ✗ ${path.relative(ROOT, target)} 是多余的产物`);
      } else {
        fs.rmSync(target);
        console.log(`[locale] 删除多余产物 ${name}`);
      }
    }
  }

  if (args.check) {
    if (drift > 0) {
      console.error(`[locale] ${drift} 个文件需要重新生成：node registry/tools/gen-locale.mjs`);
      process.exit(1);
    }
    console.log(`[locale] ✅ ${languages.length} 个语言包与源一致`);
    return;
  }

  console.log(`[locale] 生成 ${languages.length} 个语言包 → ${path.relative(ROOT, OUT_DIR)}`);
}

await main();
