/**
 * L5 · 无障碍 —— axe 扫全部 demo（逐 demo 判定「恰好等于」）。
 *
 * ── 契约（实测自 antd 6.6.4）────────────────────────────────────────────────
 *
 * 候选列表是 `ul[role="menu"]` + `li[role="menuitem"]`，焦点**始终留在 textarea**
 * （上游注释：`The focus is controlled by textarea to make accessibility easy`）
 * ⇒ 候选项除 `tabindex="-1"` 外不可聚焦，键盘走 textarea 的 ↑ / ↓ / Enter / ESC。
 *
 * ── 为什么**不用** `a11yDemoTest`（而是手写循环）──────────────────────────────
 *
 * `a11yDemoTest` 的 `allow` 是**全局**的，且要求**每个 demo 都命中**每一条豁免。
 * 而 mentions 的 `label` 违规只出现在「demo 里既没有 `placeholder`、也没有
 * `Form.Item` 的 label」的那 9 个 demo 上 —— 全局豁免在其余 7 个 demo 上会变成
 * 「未被命中的豁免」⇒ 红。
 *
 * ⇒ 改用 `color-picker/__tests__/a11y.test.ts` 的手写循环（**按 demo 给豁免**），
 *    并保留它两条判据：① 未豁免的违规必须为空；② 豁免项必须**真的出现**（防腐烂）。
 *
 * ── 关于 `label` 这条豁免（= UPSTREAM U13 的同族）────────────────────────────
 *
 * 文本框的可访问名由**使用方**决定（`placeholder` / `aria-label` /
 * `Form.Item` 的 label 三者任一）—— antd 6.6.4 同样不绑 `<label>`，
 * 组件也猜不出「这段文本在说什么」。**上游自己就是整条禁用的**：
 * `components/mentions/__tests__/a11y.test.ts` = `accessibilityDemoTest('mentions',
 * { disabledRules: ['label'] })`。本仓的 `a11yDemoTest` 刻意不提供 `disabledRules`，
 * 所以这里逐 demo 显式豁免（R13「不低于 antd」）。
 *
 * ⚠️ `axe.run()` 不能与 `vi.useFakeTimers()` 共存（PITFALLS 268）—— 本文件不用假定时器。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const demos = import.meta.glob('../demo/*.vue', { eager: true }) as Record<
  string,
  { default: unknown }
>;

/**
 * 需要 `label` 豁免的 demo（**理由逐条相同**）：demo 里没有给文本框任何可访问名
 * （没有 `placeholder`、也没有 `Form.Item` 的 label）。
 *
 * ⚠️ 这份清单是**可自证**的：下面的循环会断言「列在这里的 demo 真的出现了 `label`
 * 违规」—— 给某个 demo 补了 `placeholder` 却忘了删这一行 ⇒ 红。
 */
const LABEL_ALLOWED = new Set([
  'basic',
  'autoSize',
  'placement',
  'allowClear',
  'async',
  'status',
  'popupRender',
  'component-token',
  'render-panel',
]);

const demoName = (path: string): string => path.replace('../demo/', '').replace('.vue', '');

const entries = Object.entries(demos).sort(([a], [b]) => a.localeCompare(b));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Mentions · a11y（axe）', () => {
  it(`demo 条数等于 16（实际 ${entries.length}）`, () => {
    expect(entries).toHaveLength(16);
  });

  for (const [path, mod] of entries) {
    const name = demoName(path);
    const allow = LABEL_ALLOWED.has(name) ? ['label'] : [];

    it(`${path} ${allow.length ? `仅豁免 ${allow.join(', ')}` : '无 axe violation'}`, async () => {
      const wrapper = mount(mod.default as never, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();

      const results = await axe.run(document.body, { runOnly: { type: 'tag', values: TAGS } });
      const hit = results.violations.map((v) => v.id);

      expect(hit.filter((id) => !allow.includes(id))).toEqual([]);
      // 豁免必须**真的出现**（否则是永久的假绿灯）
      for (const id of allow) {
        expect(hit).toContain(id);
      }

      wrapper.unmount();
    });
  }
});
