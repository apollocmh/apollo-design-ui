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

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/back-top.dom.json';
import { BackTop } from '../index';

const specs: Record<string, { render: () => DomRenderResult }> = {
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

domContractTest('BackTop', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[BackTop L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
