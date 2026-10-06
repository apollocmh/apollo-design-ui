/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Tooltip
 *
 * 基准：`tests/compat/baselines/tooltip.dom.json`（9 个用例，
 * 产出者 `tests/compat/baseline/tooltip.mjs`）。SSR 里 rc-trigger 只渲染
 * 触发元素；浮层 DOM 经由 PurePanel（唯一 SSR 可达的完整浮层）覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
// ⚠️ 禁 VTU teleport-stub（翻转 open 会重挂子树；真实 Teleport 无此问题）——
// 本文件的 toHtml 挂载走共享路径，无法逐用例传 global，改用 VTU 模块级配置。
import { config } from '@vue/test-utils';

config.global.stubs = { ...config.global.stubs, teleport: false };

import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/tooltip.dom.json';
import { Tooltip, TooltipPurePanel } from '../index';

const BP = { prefixCls: 'apollo-tooltip' } as const;

const specs: Record<string, { render: () => DomRenderResult }> = {
  'tooltip:basic': {
    render: () => h(Tooltip, { ...BP, title: 'prompt text' } as never, { default: () => 'target' }),
  },
  'tooltip:open': {
    render: () =>
      h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-1' } as never, {
        default: () => 'target',
      }),
  },
  'tooltip:open-no-title': {
    render: () =>
      h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-3' } as never, {
        default: () => 'target',
      }),
  },
  'tooltip:open-zero-title': {
    // C8-R2：0 走 `#title` 插槽（isRenderable(0) ⇒ 有内容）
    render: () =>
      h(Tooltip, { ...BP, open: true, id: 'tip-4' } as never, {
        default: () => 'target',
        title: () => 0,
      }),
  },
  'tooltip:open-existing-describedby': {
    render: () =>
      h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-2' } as never, {
        default: () => h('span', { 'aria-describedby': 'other' }, 'target'),
      }),
  },
  'tooltip:open-class': {
    render: () =>
      h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-5' } as never, {
        default: () => h('span', 'target'),
      }),
  },
  'tooltip:pure-panel': {
    render: () => h(TooltipPurePanel, { ...BP, title: 'Hello Pure Panel!' } as never),
  },
  'tooltip:pure-panel-color': {
    render: () => h(TooltipPurePanel, { ...BP, title: 'Hello Pink!', color: 'pink' } as never),
  },
  'tooltip:pure-panel-custom-color': {
    render: () => h(TooltipPurePanel, { ...BP, title: 'Hello Custom!', color: '#f50' } as never),
  },
};

domContractTest('Tooltip', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
