/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Notification
 *
 * 基准：`tests/compat/baselines/notification.dom.json`（4 个用例，产出者
 * `tests/compat/baseline/notification.mjs`）。cssinjs 类由 dom-contract 对称剔除。
 *
 * ⚠️ 命令式路径整体走 portal ⇒ SSR 不可见；L4 的目标是**静态面板**
 *    `_InternalPanel*` / `_InternalList*`（与 message 同判）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/notification.dom.json';
import PureList from '../PureList';
import PurePanel from '../PurePanel';

const BP = { prefixCls: 'apollo-notification' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'notification:pure-panel': {
    render: () =>
      h(PurePanel, { ...BP, type: 'success', title: 'Hello', description: 'Desc' } as never),
  },
  'notification:pure-panel-no-close': {
    render: () => h(PurePanel, { ...BP, title: 'Plain', closable: false } as never),
  },
  'notification:pure-panel-actions': {
    render: () =>
      h(PurePanel, {
        ...BP,
        title: 'With actions',
        actions: h('button', null, 'OK'),
      } as never),
  },
  'notification:pure-list': {
    render: () =>
      h(PureList, {
        items: [
          { key: 'a', title: 'one', description: 'd1', type: 'info' },
          { key: 'b', title: 'two', description: 'd2', type: 'error' },
        ],
      } as never),
  },
};

domContractTest('Notification', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
