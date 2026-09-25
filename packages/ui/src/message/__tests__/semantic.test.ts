/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Message
 *
 * 基准：`tests/compat/baselines/message.dom.json`（4 个用例，产出者
 * `tests/compat/baseline/message.mjs`）。cssinjs 类（css-dev-only-do-not-override /
 * css-var-root / -css-var）由 dom-contract 对称剔除。
 *
 * ⚠️ 命令式路径整体走 portal ⇒ SSR 不可见（与 tooltip/popover/image 同判）；
 *    L4 的目标是**静态面板** `_InternalPanel*` / `_InternalList*`。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/message.dom.json';
import PureList from '../PureList';
import PurePanel from '../PurePanel';

const BP = { prefixCls: 'apollo-message' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'message:pure-panel': {
    render: () => h(PurePanel, { ...BP, type: 'success', content: 'Hello' } as never),
  },
  'message:pure-panel-plain': {
    render: () => h(PurePanel, { ...BP, content: 'Plain' } as never),
  },
  'message:pure-panel-icon': {
    render: () =>
      h(PurePanel, {
        ...BP,
        type: 'info',
        content: 'Custom',
        icon: h('i', { class: 'my-icon' }),
      } as never),
  },
  'message:pure-list': {
    render: () =>
      h(PureList, {
        items: [
          { key: 'a', content: 'one', type: 'info' },
          { key: 'b', content: 'two', type: 'error' },
        ],
      } as never),
  },
};

domContractTest('Message', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
