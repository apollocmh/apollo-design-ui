/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Drawer
 *
 * 基准：`tests/compat/baselines/drawer.dom.json`（4 个用例，产出者
 * `tests/compat/baseline/drawer.mjs`）。cssinjs 类由 dom-contract 对称剔除。
 *
 * ⚠️ 打开的 `<Drawer>` 走 portal ⇒ SSR 不可见；L4 的目标是 **PurePanel**
 *    （`_InternalPanelDoNotUseOrYouWillBeFired`），四个方位各一条。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/drawer.dom.json';
import PurePanel from '../PurePanel';

const BP = { prefixCls: 'apollo-drawer' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'drawer:pure-panel': {
    render: () =>
      h(PurePanel, { ...BP, title: 'Title' } as never, {
        default: () => 'Body',
        footer: () => 'Footer',
        extra: () => 'Extra',
      }),
  },
  'drawer:pure-panel-right': {
    render: () => h(PurePanel, { ...BP, title: 'T' } as never, { default: () => 'Body' }),
  },
  'drawer:pure-panel-top': {
    render: () =>
      h(PurePanel, { ...BP, placement: 'top', title: 'T' } as never, { default: () => 'Body' }),
  },
  'drawer:pure-panel-no-close': {
    render: () =>
      h(PurePanel, { ...BP, title: 'T', closable: false } as never, { default: () => 'B' }),
  },
};

domContractTest('Drawer', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
