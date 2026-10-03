/**
 * 护栏 · L4 基线的「时间依赖」扫描（KNOWN-ISSUES §2.4 / §3 #2）。
 *
 * 防的是什么：`calendar:no-value` 那类用例 —— 组件在**不传值**时取 `getNow()`
 * （运行时求值）⇒ L4 基线里固化了「生成那天的日期」⇒ 门禁**每天跨午夜就红**，
 * 且红灯与实现质量无关（假红）。§2.4 已把那条用例移出 L4（行为由语义断言覆盖），
 * 这里把「同类坑不再进来」固化成护栏。
 *
 * 扫描对象是**基线生成器**（`tests/compat/baseline/*.mjs`）—— 基线产物（.dom.json）
 * 是一次性冻结的，真正的危险面是「生成器在**哪天跑**就产出**哪天**的内容」：
 *
 *   - `Date.now(` / `Math.random(` / `new Date()`（无参） ⇒ 直接禁；
 *   - `xx.getNow(`：只禁**活配置**上的调用（如 picker 的 `base.getNow(`），
 *     放行 `generateConfig.getNow(`（那是已经冻结过的包装层）；
 *   - 豁免两条已知无害形态：`generatedAt: new Date().toISOString()`（元数据字段，
 *     不参与 oracle 比对 —— runner 只比 `cases`）与**注释里的提及**
 *     （calendar.mjs / picker.mjs 用注释记录「为什么必须冻结」，那是文档不是代码）。
 *
 * 📌 实战战绩（2026-10-03 首跑即抓到）：picker.mjs 的 `createFixedGenerateConfig`
 *    注释说「getNow 换成常量」，实际是 `base.getNow().startOf('day').add(10:20:30)`
 *    —— **活日期**。生成日与 Vue 侧冻结常量巧合相等 ⇒ 全绿；换天重新生成基线
 *    就会产出十月网格、与 Vue 冻结的九月网格失配 ⇒ L4 大面积假红。已改为真常量。
 *
 * ⚠️ 自证：最后一条用例把扫描逻辑喂**合成样本**（应命中 / 不应误报各若干），
 *    防止正则被改坏后护栏**静默假绿**。
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const BASELINE_GENERATORS_DIR = join(REPO_ROOT, 'tests', 'compat', 'baseline');

/** 生成器里禁止的「活时钟 / 随机」API（按调用形态，不是裸词）。 */
const LIVE_API_SNIPPETS = ['Date.now(', 'Math.random(', 'new Date()'] as const;

/** 活配置上的 `getNow` 调用（`base.getNow(`）；放行 `generateConfig.getNow(` 这类冻结包装。 */
const LIVE_GETNOW_RE = /(?<!Config)\.getNow\(/;

/**
 * 豁免登记：`<生成器文件名>:<API 片段>`。
 * 双向校验：登记了却扫不到 ⇒ 红（防豁免空转）。
 */
const EXEMPTED = new Set<string>([]);

function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort();
}

/** 粗略剥掉注释（`// …` 行与 `/* … *​/` 块），只留代码。 */
export function stripComments(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

/** 剥掉 generatedAt 元数据行（不进 oracle，见文件头）。 */
export function stripGeneratedAt(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.includes('generatedAt'))
    .join('\n');
}

/** 对一份生成器代码做活时钟扫描，返回 `[api, 上下文行]` 列表。 */
export function scanLiveApis(code: string): string[] {
  const hits: string[] = [];
  for (const api of LIVE_API_SNIPPETS) {
    if (code.includes(api)) hits.push(api);
  }
  if (LIVE_GETNOW_RE.test(code)) hits.push('.getNow( (non-frozen receiver)');
  return hits;
}

describe('护栏 · L4 基线生成器的活时钟（§2.4 / §3 #2）', () => {
  it('基线生成器 *.mjs 不调用时间 / 随机 API', () => {
    const offenders: string[] = [];
    for (const f of listFiles(BASELINE_GENERATORS_DIR, '.mjs')) {
      const code = stripGeneratedAt(stripComments(readFileSync(join(BASELINE_GENERATORS_DIR, f), 'utf8')));
      const hit = scanLiveApis(code);
      if (hit.length > 0) {
        for (const api of hit) {
          if (!EXEMPTED.has(`${f}:${api}`)) offenders.push(`${f}: ${api}`);
        }
      }
    }
    expect(
      offenders,
      '生成器里出现活时钟/随机 API ⇒ 基线不可复现（换天/换机器重新生成就与冻结产物失配）',
    ).toEqual([]);
  });

  it('豁免名单双向校验：登记的条目必须仍能命中（防豁免空转）', () => {
    for (const key of EXEMPTED) {
      const [file, api] = key.split(':');
      const path = join(BASELINE_GENERATORS_DIR, file);
      expect(existsSync(path), `豁免登记的文件不存在：${file}`).toBe(true);
      const code = stripGeneratedAt(stripComments(readFileSync(path, 'utf8')));
      expect(
        scanLiveApis(code).includes(api),
        `豁免登记 \`${key}\` 已扫不到 —— 生成器改了，请清理这条豁免`,
      ).toBe(true);
    }
  });

  it('🚨 自证：扫描逻辑对合成样本必须精确命中 / 不误报（防护栏假绿）', () => {
    // 应命中：三种活时钟 + 活配置 getNow
    const bad = [
      'const a = Date.now();',
      'const b = Math.random();',
      'const c = new Date().toISOString(); // generatedAt', // 此行会被 stripGeneratedAt 滤掉
      'getNow: () => base.getNow().startOf("day"),',
    ].join('\n');
    const scannedBad = scanLiveApis(stripGeneratedAt(stripComments(bad)));
    expect(scannedBad).toEqual([
      'Date.now(',
      'Math.random(',
      '.getNow( (non-frozen receiver)',
    ]);
    // 不误报：冻结包装的 getNow + generatedAt + 注释提及
    const good = [
      '// 提及 Date.now( 的注释 —— 不算',
      'getNow: () => dayjs(FIXED_NOW),',
      'pickerValue: generateConfig.getNow(),',
      'generatedAt: new Date().toISOString(),',
    ].join('\n');
    expect(scanLiveApis(stripGeneratedAt(stripComments(good)))).toEqual([]);
  });
});
