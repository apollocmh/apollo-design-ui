/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— BackTop
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/back-top.dom.json`，由 `tests/compat/baseline/back-top.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 BackTop 产出。
 * 机械 oracle。
 *
 * ── 刻意不在基线里的用例（G1 §2.8）──────────────────────────────────────────
 *
 * `visibilityHeight > 0`：初始 visible=false → rc-motion 首帧渲染 null（SSR 只有
 * 空根 div）—— 两条渲染路径平台一致，L2 的时序断言负责。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { beforeAll } from 'vitest';
import { createSSRApp, h, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import baseline from '../../../../../tests/compat/baselines/back-top.dom.json';
import { BackTop } from '../index';

const specs: Record<string, { render: () => VNode }> = {
  'back-top:prefix-cls:no-props': { render: () => h(BackTop, { visibilityHeight: 0 }) },
  'back-top:basic': { render: () => h(BackTop, { visibilityHeight: 0 }) },
  'back-top:custom-children': {
    render: () =>
      h(BackTop, { visibilityHeight: 0, class: 'user-class' }, () =>
        h('div', { class: 'my-content' }, 'top'),
      ),
  },
  'back-top:default-with-attrs': {
    render: () =>
      h(BackTop, {
        visibilityHeight: 0,
        'aria-label': 'back to top',
        'data-testid': 'bt',
      } as never),
  },
};

// Oracle 来自 renderToStaticMarkup；Vue 侧也使用 SSR，而非读取 mount 的动画首帧。
const markup = new Map<string, string>();
beforeAll(async () => {
  for (const [id, spec] of Object.entries(specs)) {
    markup.set(id, await renderToString(createSSRApp({ render: spec.render })));
  }
});

domContractTest('BackTop', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[BackTop L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    const html = markup.get(id);
    if (html === undefined) throw new Error(`[BackTop L4] SSR markup missing: ${id}`);
    return html;
  },
});
