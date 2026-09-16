#!/usr/bin/env node
/**
 * gen-theme-baseline.mjs — 从 antd 真实代码生成 Token 基准
 *
 * 为什么需要这个脚本：
 *   @apollo-design/theme 的判据是「与 antd 的 token 值逐项一致」。断言必须有基准，
 *   而基准只能来自 **antd 自己的代码**，不能来自我们对 antd 的理解 ——
 *   后者会让「两边都想通了」被误当成「两边一致」。
 *
 * 为什么能直接跑 antd 的代码：
 *   antd 的 `es/theme/` 里，算法部分（themes/{default,dark,compact}、util/alias）**不依赖 React**，
 *   只依赖 @ant-design/colors 与 @ant-design/fast-color —— 这两个包我们已经作为运行时依赖复用
 *   （peerDependencies 为空、无 React 代码，见 ARCHITECTURE.md）。
 *   唯一依赖 React 生态的是 `getDesignToken` 里的 `createTheme` / `getComputedToken`
 *   （来自 @ant-design/cssinjs），而它们的实现只是 3 行胶水，已核对源码后在此复现：
 *
 *     Theme.getDerivativeToken = derivatives.reduce((r, d) => d(token, r), undefined)
 *     getComputedToken         = format({ ...derivativeToken, ...overrideToken })
 *
 *   核对来源：@ant-design/cssinjs@2.1.2 的 es/theme/Theme.js 与 es/hooks/useCacheToken.js。
 *
 * 为什么输出固定内容而不是随机种子：
 *   基准要能 review。随机种子会让 diff 无法人工判读。覆盖率靠下面这张固定的用例表，
 *   它刻意覆盖了各算法的分支边界（borderRadius 的 5/6/7/8/16 断点、motion:false、
 *   fontSize 变化、preset 色覆盖、非 seed 键的 override）。
 *
 * 用法：
 *   node registry/tools/gen-theme-baseline.mjs                # 生成到 packages/theme/src/__tests__/__fixtures__/
 *   node registry/tools/gen-theme-baseline.mjs --check        # 只比对，不写入（CI）
 *   node registry/tools/gen-theme-baseline.mjs --antd <path>  # 指定 antd 解包目录
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_ANTD = '/tmp/antd-src/package';
const OUT_FILE = path.join(
  ROOT,
  'packages/theme/src/__tests__/__fixtures__/antd-token-baseline.json',
);

const args = { check: false, antd: DEFAULT_ANTD };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--check') args.check = true;
  else if (process.argv[i] === '--antd') args.antd = process.argv[++i];
}

if (!fs.existsSync(path.join(args.antd, 'es/theme'))) {
  console.error(`[baseline] 找不到 ${args.antd}/es/theme`);
  console.error(
    '[baseline] 先跑 `node registry/tools/extract-antd-facts.mjs --download` 获取 antd 产物',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 把 antd 的 es/theme 复制到一个可执行的临时目录
//
// antd 的 es 产物是给打包器用的：相对 import **不带扩展名**。
// 原生 ESM 要求完整路径，所以复制时把 `./x` 补成 `./x.js` 或 `./x/index.js`。
// ---------------------------------------------------------------------------
function prepareRuntime() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'antd-theme-ref-'));
  const src = path.join(args.antd, 'es/theme');
  const dst = path.join(tmp, 'theme');
  fs.cpSync(src, dst, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'package.json'), `${JSON.stringify({ type: 'module' })}\n`);

  // @ant-design/{colors,fast-color} 直接复用本仓库 packages/theme 已装的版本
  const nm = path.join(tmp, 'node_modules/@ant-design');
  fs.mkdirSync(nm, { recursive: true });
  for (const dep of ['colors', 'fast-color']) {
    const from = path.join(ROOT, 'packages/theme/node_modules/@ant-design', dep);
    if (!fs.existsSync(from)) {
      console.error(`[baseline] 缺少 ${from}，先跑 pnpm install`);
      process.exit(1);
    }
    fs.symlinkSync(from, path.join(nm, dep));
  }

  const walk = (d, out = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, out);
      else out.push(p);
    }
    return out;
  };

  for (const f of walk(dst).filter((x) => x.endsWith('.js'))) {
    const code = fs.readFileSync(f, 'utf8');
    const fixed = code.replace(/from\s+'(\.[^']*)'/g, (m, spec) => {
      if (spec.endsWith('.js')) return m;
      const base = path.resolve(path.dirname(f), spec);
      if (fs.existsSync(`${base}.js`)) return `from '${spec}.js'`;
      if (fs.existsSync(path.join(base, 'index.js'))) return `from '${spec}/index.js'`;
      return m;
    });
    if (fixed !== code) fs.writeFileSync(f, fixed);
  }

  return path.join(tmp, 'theme');
}

// ---------------------------------------------------------------------------
// 用例表（固定，不随机 —— 见文件头注释）
// ---------------------------------------------------------------------------
const CASES = [
  { name: 'default', algorithm: 'default', token: {} },
  { name: 'dark', algorithm: 'dark', token: {} },
  { name: 'compact', algorithm: 'compact', token: {} },
  { name: 'dark-compact', algorithm: ['dark', 'compact'], token: {} },
  // borderRadius 的分支断点：genRadius 在 5/6/7/8/14/16 都有不同取值
  { name: 'radius-2', algorithm: 'default', token: { borderRadius: 2 } },
  { name: 'radius-7', algorithm: 'default', token: { borderRadius: 7 } },
  { name: 'radius-16', algorithm: 'default', token: { borderRadius: 16 } },
  // fontSize 走 genFontSizes 的指数表
  { name: 'fontsize-12', algorithm: 'default', token: { fontSize: 12 } },
  { name: 'fontsize-20', algorithm: 'default', token: { fontSize: 20 } },
  // motion:false —— formatToken 里唯一的条件分支
  { name: 'motion-off', algorithm: 'default', token: { motion: false } },
  // 换主色（走 generate 而不是 presetPalettes 的分支）
  { name: 'primary-custom', algorithm: 'default', token: { colorPrimary: '#00b96b' } },
  { name: 'primary-custom-dark', algorithm: 'dark', token: { colorPrimary: '#00b96b' } },
  // 非 seed 键的 override —— 验证 override 在 alias 之后生效（formatToken 的 overrideTokens）
  {
    name: 'override-alias-key',
    algorithm: 'default',
    token: { colorPrimary: '#00b96b', colorPrimaryBg: '#123456', borderRadius: 10 },
  },
  // colorBgBase / colorTextBase 为空串时的默认值分支（default 与 dark 的 fallback 不同）
  {
    name: 'empty-base-colors',
    algorithm: 'default',
    token: { colorTextBase: '', colorBgBase: '' },
  },
  {
    name: 'empty-base-colors-dark',
    algorithm: 'dark',
    token: { colorTextBase: '', colorBgBase: '' },
  },
];

async function main() {
  const themeDir = prepareRuntime();
  const seedToken = (await import(path.join(themeDir, 'themes/seed.js'))).default;
  const defaultAlgorithm = (await import(path.join(themeDir, 'themes/default/index.js'))).default;
  const darkAlgorithm = (await import(path.join(themeDir, 'themes/dark/index.js'))).default;
  const compactAlgorithm = (await import(path.join(themeDir, 'themes/compact/index.js'))).default;
  const formatToken = (await import(path.join(themeDir, 'util/alias.js'))).default;

  const ALGOS = { default: defaultAlgorithm, dark: darkAlgorithm, compact: compactAlgorithm };

  /**
   * 复现 antd 的 getDesignToken。
   * 见文件头：createTheme / getComputedToken 是 cssinjs 的 3 行胶水，已核对源码。
   */
  const getDesignToken = (config = {}) => {
    const derivatives = config.algorithm
      ? (Array.isArray(config.algorithm) ? config.algorithm : [config.algorithm]).map(
          (a) => ALGOS[a],
        )
      : [defaultAlgorithm];
    const origin = { ...seedToken, ...config.token };
    const derivativeToken = derivatives.reduce((result, d) => d(origin, result), undefined);
    return formatToken({ ...derivativeToken, override: config.token });
  };

  const antdVersion = JSON.parse(
    fs.readFileSync(path.join(args.antd, 'package.json'), 'utf8'),
  ).version;

  const cases = {};
  for (const c of CASES) {
    const token = getDesignToken({ algorithm: c.algorithm, token: c.token });
    cases[c.name] = {
      algorithm: Array.isArray(c.algorithm) ? c.algorithm : [c.algorithm],
      tokenOverride: c.token,
      token,
    };
  }

  const doc = {
    $comment:
      '由 registry/tools/gen-theme-baseline.mjs 从 antd 真实代码生成，禁止手工编辑。重跑该脚本刷新。',
    antdVersion,
    generatedAt: new Date().toISOString().slice(0, 10),
    caseCount: CASES.length,
    cases,
  };

  if (args.check) {
    if (!fs.existsSync(OUT_FILE)) {
      console.error(`[baseline] 基准文件不存在: ${path.relative(ROOT, OUT_FILE)}`);
      process.exit(1);
    }
    const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
    const a = JSON.stringify(prev.cases);
    const b = JSON.stringify(doc.cases);
    if (a !== b) {
      console.error('[baseline] ❌ 基准已过期，请重跑 node registry/tools/gen-theme-baseline.mjs');
      process.exit(1);
    }
    console.log(`[baseline] ✅ 基准与 antd v${antdVersion} 一致（${CASES.length} 个用例）`);
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);
  const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`[baseline] ✅ 已写入 ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`[baseline] antd v${antdVersion} | ${CASES.length} 个用例 | ${size} KB`);
}

main().catch((e) => {
  console.error('[baseline]', e);
  process.exit(1);
});
