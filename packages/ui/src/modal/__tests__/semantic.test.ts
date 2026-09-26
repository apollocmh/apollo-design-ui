/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Modal
 *
 * 基准：`tests/compat/baselines/modal.dom.json`（9 个用例，产出者
 * `tests/compat/baseline/modal.mjs`）。cssinjs 类由 dom-contract 对称剔除。
 *
 * ⚠️ 打开的 `<Modal>` 走 portal ⇒ SSR 不可见；L4 的目标是 **PurePanel**
 *    （`_InternalPanelDoNotUseOrYouWillBeFired`）—— 普通形态 + 4 种 confirm 形态
 *    + 无标题 + footer 函数形态。
 *
 * ⚠️ PurePanel 的 `aria-labelledby` **恒缺省**（上游不给它 `ariaId`），
 *    这一条由基线钉住 —— 别「顺手补上」。
 */
import { domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/modal.dom.json';
import PurePanel from '../PurePanel';

const BP = { prefixCls: 'apollo-modal' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'modal:pure-panel': {
    render: () =>
      h(PurePanel, { ...BP, title: 'Title', footer: 'Footer', closable: true } as never, {
        default: () => 'Body',
      }),
  },
  'modal:pure-panel-no-close': {
    render: () =>
      h(PurePanel, { ...BP, title: 'T', closable: false } as never, { default: () => 'B' }),
  },
  'modal:pure-panel-confirm': {
    render: () => h(PurePanel, { ...BP, type: 'confirm', title: 'T', content: 'C' } as never),
  },
  'modal:pure-panel-info': {
    render: () => h(PurePanel, { ...BP, type: 'info', title: 'T', content: 'C' } as never),
  },
  'modal:pure-panel-success': {
    render: () => h(PurePanel, { ...BP, type: 'success', title: 'T', content: 'C' } as never),
  },
  'modal:pure-panel-error': {
    render: () => h(PurePanel, { ...BP, type: 'error', title: 'T', content: 'C' } as never),
  },
  'modal:pure-panel-warning': {
    render: () => h(PurePanel, { ...BP, type: 'warning', title: 'T', content: 'C' } as never),
  },
  'modal:pure-panel-confirm-no-title': {
    render: () => h(PurePanel, { ...BP, type: 'confirm', content: 'C' } as never),
  },
  'modal:pure-panel-footer-fn': {
    render: () =>
      h(
        PurePanel,
        {
          ...BP,
          title: 'T',
          footer: (originNode: unknown) =>
            h('div', { class: 'custom-footer' }, originNode as never),
        } as never,
        { default: () => 'Body' },
      ),
  },
};

domContractTest('Modal', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
