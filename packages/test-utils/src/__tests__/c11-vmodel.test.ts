/**
 * 护栏 · 规则 C11（`update:xxx` 与语义事件同时发出）的全仓扫描。
 *
 * 防的是什么（PITFALLS 162）：组件有受控 value 形 prop（`value` / `checked` /
 * `activeKey` / `current` / `fileList`）却没提供 `update:xxx` 通道 ⇒
 * 用户写 `v-model:xxx` **静默不生效**（编译期无告警、测试不报错）。
 *
 * 判据：对每个组件目录下的**主文件**，若声明了受控 prop 且文件里没有对应的
 * `update:<prop>` 字样 ⇒ 红。豁免登记走 `EXEMPTED`（双向校验，防豁免空转）。
 *
 * ⚠️ 已知 N/A（有 value 字样但语义上不是 v-model 目标，勿再排查）：
 *   - `checkbox/Checkbox.ts` 的 `value`：deprecated 告警用的别名（真通道是 update:checked）
 *   - `radio/Radio.ts` 的 `value`：同上（Group 侧有 update:value）
 *   - `menu/Menu.ts` 的 `activeKey`：上游无 v-model:activeKey（通道是 selectedKeys/openKeys）
 *   - `qr-code/QrCode.ts` 的 `value`：编码内容，不是受控状态
 *   - `cascader/OptionList.ts` 的 `checked`：引擎内部态（公开通道在 Cascader 的 update:value）
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const UI_SRC = join(REPO_ROOT, 'packages', 'ui', 'src');

/** C11 关心的受控 value 形 prop（open 对纯展示组件无意义，不在此列）。 */
const VALUE_PROPS = ['value', 'checked', 'activeKey', 'current', 'fileList'] as const;

/** 已知 N/A 的 `组件/文件:prop` 组合（双向校验）。 */
const EXEMPTED = new Set<string>([
  'checkbox/Checkbox.ts:value',
  'radio/Radio.ts:value',
  'menu/Menu.ts:activeKey',
  'qr-code/QrCode.ts:value',
  'cascader/OptionList.ts:checked',
]);

function mainFiles(componentDir: string): string[] {
  if (!existsSync(componentDir)) return [];
  return readdirSync(componentDir)
    .filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.vue')) &&
        /^[A-Z]/.test(f) &&
        !f.includes('Panel.'),
    )
    .sort();
}

describe('护栏 · C11 v-model 通道（update:xxx）', () => {
  it('每个受控 value 形 prop 都有对应的 update: 通道（豁免名单之外）', () => {
    const offenders: string[] = [];
    for (const comp of readdirSync(UI_SRC).sort()) {
      const dir = join(UI_SRC, comp);
      if (!existsSync(dir)) continue;
      let isDir = false;
      try {
        isDir = readdirSync(dir).some((f) => f.startsWith('index'));
      } catch {
        continue; // 不是目录（如 .DS_Store）
      }
      if (!isDir) continue;
      for (const f of mainFiles(dir)) {
        const text = readFileSync(join(dir, f), 'utf8');
        if (!text.includes('emits') && !text.includes('emit(')) continue;
        const hasUpdate = new Set([...text.matchAll(/update:(\w+)/g)].map((m) => m[1]));
        for (const prop of VALUE_PROPS) {
          // 受控 prop 形态：`prop: {` 的 props 声明（排除 defaultxxx / 其他单词的一部分）
          if (!new RegExp(`\\b${prop}\\s*:\\s*\\{`).test(text)) continue;
          if (hasUpdate.has(prop)) continue;
          const key = `${comp}/${f}:${prop}`;
          if (!EXEMPTED.has(key)) offenders.push(key);
        }
      }
    }
    expect(
      offenders,
      '组件声明了受控 value 形 prop 但没有 update: 通道 ⇒ v-model 静默失效（PITFALLS 162）。' +
        '若该 prop 语义上不是 v-model 目标，请登记进 EXEMPTED 并注明理由。',
    ).toEqual([]);
  });

  it('豁免名单双向校验：登记的条目必须仍然命中（防豁免空转）', () => {
    for (const key of EXEMPTED) {
      const [compFile, prop] = [key.slice(0, key.lastIndexOf(':')), key.split(':').pop()!];
      const path = join(UI_SRC, compFile);
      expect(existsSync(path), `豁免登记的文件不存在：${compFile}`).toBe(true);
      const text = readFileSync(path, 'utf8');
      expect(
        new RegExp(`\\b${prop}\\s*:\\s*\\{`).test(text),
        `豁免登记 \`${key}\` 已扫不到（prop 被删/改名）—— 请清理这条豁免`,
      ).toBe(true);
    }
  });
});
