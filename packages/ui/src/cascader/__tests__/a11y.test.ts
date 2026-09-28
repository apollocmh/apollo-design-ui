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
// ⚠️ 豁免必须**恰好命中**：panel demo 没有 combobox input，单独扫（不带豁免）。
const allDemos = import.meta.glob('../demo/*.vue', { eager: true });
const comboboxDemos = Object.fromEntries(
  Object.entries(allDemos).filter(([path]) => !path.includes('panel')),
);
const panelDemo = Object.fromEntries(
  Object.entries(allDemos).filter(([path]) => path.includes('panel')),
);

// 豁免 label：与 select 同判（R13「不低于 antd」）—— combobox 的可访问名由
// role=combobox + aria-* 状态承担。⚠️ 豁免必须**恰好命中**：panel demo 没有
// combobox input，所以 panel 单独扫（不带豁免）。
a11yDemoTest('Cascader', {
  demos: comboboxDemos,
  expectCount: 4,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason:
        'combobox 的可访问名由 role=combobox + aria-* 状态承担（antd a11y.test.ts 同款放行）。',
    },
  ],
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
