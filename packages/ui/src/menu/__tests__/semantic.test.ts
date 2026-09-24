/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Menu
 *
 * 基准：`tests/compat/baselines/menu.dom.json`（6 个用例，
 * 产出者 `tests/compat/baseline/menu.mjs`）。
 * data-menu-id 的 uuid 两侧不同 ⇒ dom-contract 归一为 {iN} token（对称）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（翻转 open 会重挂子树；真实 Teleport 无此问题）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/menu.dom.json';
import Menu from '../Menu';

const BP = { prefixCls: 'apollo-menu' };

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two', disabled: true },
  { type: 'divider', key: 'd1' },
  {
    key: 'sub1',
    label: 'Sub',
    children: [
      { key: '3', label: 'Three' },
      { key: 'sub2', label: 'Inner', children: [{ key: '4', label: 'Four' }] },
    ],
  },
  { type: 'group', key: 'g1', label: 'Group', children: [{ key: '5', label: 'Five' }] },
];

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'menu:vertical': {
    render: () => h(Menu, { ...BP, items, defaultOpenKeys: ['sub1'], mode: 'vertical' } as never),
  },
  'menu:inline': {
    render: () => h(Menu, { ...BP, items, defaultOpenKeys: ['sub1'], mode: 'inline' } as never),
  },
  'menu:inline-collapsed': {
    render: () => h(Menu, { ...BP, items, mode: 'inline', inlineCollapsed: true } as never),
  },
  'menu:horizontal': {
    render: () => h(Menu, { ...BP, items, mode: 'horizontal' } as never),
  },
  'menu:dark': {
    render: () =>
      h(Menu, {
        ...BP,
        items,
        defaultOpenKeys: ['sub1'],
        mode: 'inline',
        theme: 'dark',
      } as never),
  },
  'menu:selected': {
    render: () => h(Menu, { ...BP, items: items.slice(0, 2), selectedKeys: ['1'] } as never),
  },
};

domContractTest('Menu', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
