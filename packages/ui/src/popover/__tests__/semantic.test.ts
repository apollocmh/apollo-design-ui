/**
 * L4 · DOM 契约（与 antd 6.6.4 的机械 oracle 逐字比对）—— Popover
 *
 * 基准：`tests/compat/baselines/popover.dom.json`（13 个用例，
 * 产出者 `tests/compat/baseline/popover.mjs`）。SSR 里 rc-trigger 只渲染
 * 触发元素；浮层 DOM 经由 PurePanel（唯一 SSR 可达的完整浮层）覆盖。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（翻转 open 会重挂子树；真实 Teleport 无此问题）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/popover.dom.json';
import { Popover, PopoverPurePanel } from '../index';

const BP = { prefixCls: 'apollo-popover' };

const specs: Record<string, { render: () => ReturnType<typeof h> }> = {
  'popover:basic': {
    render: () =>
      h(Popover, { ...BP, title: 'Title', content: 'Content' } as never, {
        default: () => 'target',
      }),
  },
  'popover:open': {
    render: () =>
      h(Popover, { ...BP, title: 'Title', content: 'Content', open: true, id: 'pop-1' } as never, {
        default: () => 'target',
      }),
  },
  'popover:open-placement': {
    render: () =>
      h(
        Popover,
        {
          ...BP,
          title: 'Title',
          content: 'Content',
          open: true,
          id: 'pop-2',
          placement: 'bottomRight',
        } as never,
        { default: () => 'target' },
      ),
  },
  'popover:open-no-content': {
    render: () =>
      h(Popover, { ...BP, title: 'Title', open: true, id: 'pop-3' } as never, {
        default: () => 'target',
      }),
  },
  'popover:open-no-title': {
    render: () =>
      h(Popover, { ...BP, content: 'Content', open: true, id: 'pop-4' } as never, {
        default: () => 'target',
      }),
  },
  'popover:no-title-no-content': {
    render: () =>
      h(Popover, { ...BP, open: true, id: 'pop-5' } as never, { default: () => 'target' }),
  },
  'popover:zero-title': {
    render: () =>
      h(Popover, { ...BP, title: 0, content: 'Content', open: true, id: 'pop-6' } as never, {
        default: () => 'target',
      }),
  },
  'popover:render-function': {
    render: () =>
      h(
        Popover,
        {
          ...BP,
          title: () => 'lazy-title',
          content: () => 'lazy-content',
          open: true,
          id: 'pop-7',
        } as never,
        { default: () => 'target' },
      ),
  },
  'popover:existing-describedby': {
    render: () =>
      h(Popover, { ...BP, title: 'Title', content: 'Content', open: true, id: 'pop-8' } as never, {
        default: () => h('span', { 'aria-describedby': 'other' }, 'target'),
      }),
  },
  'popover:pure-panel': {
    render: () => h(PopoverPurePanel, { ...BP, title: 'Title', content: 'Content' } as never),
  },
  'popover:pure-panel-placement': {
    render: () =>
      h(PopoverPurePanel, {
        ...BP,
        title: 'Title',
        content: 'Content',
        placement: 'bottomLeft',
      } as never),
  },
  'popover:pure-panel-title-only': {
    render: () => h(PopoverPurePanel, { ...BP, title: 'Title' } as never),
  },
  'popover:pure-panel-content-only': {
    render: () => h(PopoverPurePanel, { ...BP, content: 'Content' } as never),
  },
};

domContractTest('Popover', {
  baseline,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`semantic.test: 基线用例 ${id} 缺少 Vue 侧 spec`);
    return spec.render();
  },
});
