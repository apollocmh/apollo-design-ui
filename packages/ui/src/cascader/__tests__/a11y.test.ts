/**
 * L5 · 无障碍 —— Cascader
 * 可达性来源：BaseSelect 的 combobox 协议（aria-expanded/controls/activedescendant）
 * + 列表 role=menu / menuitemcheckbox + label 包裹文本即可访问名。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import CascaderPanel from '../Panel';

// 豁免 label：与 select 同判（R13「不低于 antd」）—— combobox 的可访问名由
// role=combobox + aria-* 状态承担，antd 自身的 a11y.test.ts 同款放行。
// ⚠️ 豁免必须**恰好命中**，所以按可访问名情况分成三组：
//   1. 未命名的 combobox（默认占位触发器）→ 带 label 豁免；
//   2. custom-trigger（触发器是带文本的 Button）→ 不带豁免，证明真实可访问名存在；
//   3. **独立的 Panel demo**（`panel.vue`）→ 没有 combobox input，不带豁免。
// ⚠️ `render-panel.vue` 是 **Cascader + popupRender** 的普通 demo（文件名含 panel），
//    不能按子串归到独立 Panel 组。
const allDemos = import.meta.glob('../demo/*.vue', { eager: true });
const panelDemo = Object.fromEntries(
  Object.entries(allDemos).filter(([path]) => path.endsWith('/panel.vue')),
);
const customTriggerDemo = Object.fromEntries(
  Object.entries(allDemos).filter(([path]) => path.includes('custom-trigger')),
);
const comboboxDemos = Object.fromEntries(
  Object.entries(allDemos).filter(
    ([path]) => !path.endsWith('/panel.vue') && !path.includes('custom-trigger'),
  ),
);

a11yDemoTest('Cascader（未命名 combobox · label 豁免组）', {
  demos: comboboxDemos,
  expectCount: 21,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason:
        'combobox 的可访问名由 role=combobox + aria-* 状态承担（antd a11y.test.ts 同款放行）。',
    },
  ],
});

a11yDemoTest('Cascader（custom trigger 无豁免组）', {
  demos: customTriggerDemo,
  expectCount: 1,
  global: { stubs: { teleport: false } },
});

a11yDemoTest('CascaderPanel', {
  demos: panelDemo,
  expectCount: 1,
  global: { stubs: { teleport: false } },
});

describe('Cascader · ARIA 契约', () => {
  it('列是 role=menu；项是 role=menuitemcheckbox + aria-checked', async () => {
    const w = mount(CascaderPanel, {
      props: {
        options: [{ value: 'a', label: 'A', children: [{ value: 'b', label: 'B' }] }],
      },
    });
    await nextTick();
    expect(w.find('.apollo-cascader-menu').attributes('role')).toBe('menu');
    const item = w.find('.apollo-cascader-menu-item');
    expect(item.attributes('role')).toBe('menuitemcheckbox');
    expect(item.attributes('aria-checked')).toBeDefined();
    w.unmount();
  });

  it('data-path-key 存在（键盘滚动与激活定位锚点）', async () => {
    const w = mount(CascaderPanel, { props: { options: [{ value: 'a', label: 'A' }] } });
    await nextTick();
    expect(w.find('.apollo-cascader-menu-item').attributes('data-path-key')).toBe('a');
    w.unmount();
  });
});
