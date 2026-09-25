/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Dropdown
 *
 * 基准：`tests/compat/baselines/dropdown.dom.json`（5 个用例，产出者
 * `tests/compat/baseline/dropdown.mjs`）。SSR 里 rc-trigger 只渲染触发元素；
 * -trigger/-open 类与 disabled 透传是本层核心契约（浮层 DOM 走 L1/L5/L6）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（翻转 open 会重挂子树；真实 Teleport 无此问题）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/dropdown.dom.json';
import { Button } from '../../button';
import { Dropdown } from '../index';

const BP = { prefixCls: 'apollo-dropdown' };

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two', disabled: true },
  { key: 'sub', label: 'Sub', children: [{ key: '2-1', label: 'Inner' }] },
];

const target = () => h(Button, { disabled: true }, () => 'target');
const targetOn = () => h(Button, null, () => 'target');

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'dropdown:basic': {
    render: () =>
      h(Dropdown, { ...BP, menu: { items }, open: true, id: 'dd-1' } as never, {
        default: () => targetOn(),
      }),
  },
  'dropdown:placement': {
    render: () =>
      h(
        Dropdown,
        { ...BP, menu: { items }, open: true, placement: 'topLeft', id: 'dd-2' } as never,
        {
          default: () => targetOn(),
        },
      ),
  },
  'dropdown:arrow': {
    render: () =>
      h(Dropdown, { ...BP, menu: { items }, open: true, arrow: true, id: 'dd-3' } as never, {
        default: () => targetOn(),
      }),
  },
  'dropdown:disabled': {
    render: () =>
      h(Dropdown, { ...BP, menu: { items }, open: true, disabled: true, id: 'dd-4' } as never, {
        default: () => target(),
      }),
  },
  'dropdown:closed': {
    render: () => h(Dropdown, { ...BP, menu: { items } } as never, { default: () => targetOn() }),
  },
};

domContractTest('Dropdown', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
