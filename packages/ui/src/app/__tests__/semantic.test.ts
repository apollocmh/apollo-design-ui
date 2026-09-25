/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— App
 *
 * 基准：`tests/compat/baselines/app.dom.json`（3 个用例）。
 * cssVarRoot 类（css-var-root）由 dom-contract 的对称剔除处理（cssinjs 类）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/app.dom.json';
import App from '../App';

const BP = { prefixCls: 'apollo-app' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'app:basic': {
    render: () => h(App, { ...BP } as never, { default: () => h('span', 'content') }),
  },
  'app:custom-component': {
    render: () =>
      h(App, { ...BP, component: 'section' } as never, { default: () => h('span', 'x') }),
  },
  'app:nested': {
    render: () =>
      h(App, { ...BP, message: { maxCount: 1 } } as never, {
        default: () => h(App, { ...BP } as never, { default: () => h('span', 'inner') }),
      }),
  },
};

domContractTest('App', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
