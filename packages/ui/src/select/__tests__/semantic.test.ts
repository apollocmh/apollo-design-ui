/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Select
 *
 * 基准：`tests/compat/baselines/select.dom.json`（10 个用例，产出者
 * `tests/compat/baseline/select.mjs`）。SSR 里 rc-trigger 只渲染选择器；
 * 下拉 DOM 由 L1/L5/L6 承担。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';

// ⚠️ 禁 VTU teleport-stub（真实 Teleport 无此问题）
config.global.stubs = { ...config.global.stubs, teleport: false };

import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/select.dom.json';
import { Select } from '../index';

const BP = { prefixCls: 'apollo-select' };

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
];

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'select:basic': {
    render: () => h(Select, { ...BP, options, id: 'test-id' } as never),
  },
  'select:value': {
    render: () => h(Select, { ...BP, options, id: 'test-id', value: 'a' } as never),
  },
  'select:multiple': {
    render: () =>
      h(Select, { ...BP, options, id: 'test-id', mode: 'multiple', value: ['a'] } as never),
  },
  'select:disabled': {
    render: () => h(Select, { ...BP, options, id: 'test-id', disabled: true } as never),
  },
  'select:allow-clear': {
    render: () =>
      h(Select, { ...BP, options, id: 'test-id', allowClear: true, value: 'a' } as never),
  },
  'select:show-search': {
    render: () => h(Select, { ...BP, options, id: 'test-id', showSearch: true } as never),
  },
  'select:size-small': {
    render: () => h(Select, { ...BP, options, id: 'test-id', size: 'small' } as never),
  },
  'select:size-large': {
    render: () => h(Select, { ...BP, options, id: 'test-id', size: 'large' } as never),
  },
  'select:status-error': {
    render: () => h(Select, { ...BP, options, id: 'test-id', status: 'error' } as never),
  },
  'select:variant-borderless': {
    render: () => h(Select, { ...BP, options, id: 'test-id', variant: 'borderless' } as never),
  },
};

domContractTest('Select', {
  baseline,
  dropCssInJsClasses: true,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
