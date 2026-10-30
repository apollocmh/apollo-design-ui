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
import { beforeAll, expect, it } from 'vitest';
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
  // ADR 0007: preserve the original oracle and permit only this documented
  // native button/content ownership change, with exact per-case differences.
  allow: {
    'back-top:prefix-cls:no-props': {
      reason:
        'Native button, complete content host and decorative default icon; index.zh-CN.md migration',
      deviationId: 'back-top-native-button',
      diff: [
        '$/div[0]: 标签不同 <div> vs <button>',
        '$/div[0]: 我们多出属性 aria-label="Back to top"',
        '$/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 我们多出属性 aria-hidden="true"',
      ],
    },
    'back-top:basic': {
      reason:
        'Native button, complete content host and decorative default icon; index.zh-CN.md migration',
      deviationId: 'back-top-native-button',
      diff: [
        '$/div[0]: 标签不同 <div> vs <button>',
        '$/div[0]: 我们多出属性 aria-label="Back to top"',
        '$/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 我们多出属性 aria-hidden="true"',
      ],
    },
    'back-top:custom-children': {
      reason:
        'Native button with a stable host preserving the complete custom slot; index.zh-CN.md migration',
      deviationId: 'back-top-native-button',
      diff: [
        '$/div[0]: 标签不同 <div> vs <button>',
        '$/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]: 类名不同 [my-content] vs [apollo-back-top-custom]',
        '$/div[0]/div[0]: 子节点数不同 0 vs 1',
      ],
    },
    'back-top:default-with-attrs': {
      reason:
        'Native button and decorative default icon retain the caller aria-label; index.zh-CN.md migration',
      deviationId: 'back-top-native-button',
      diff: [
        '$/div[0]: 标签不同 <div> vs <button>',
        '$/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 标签不同 <div> vs <span>',
        '$/div[0]/div[0]/div[0]: 我们多出属性 aria-hidden="true"',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[BackTop L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    const html = markup.get(id);
    if (html === undefined) throw new Error(`[BackTop L4] SSR markup missing: ${id}`);
    return html;
  },
});

it('SSR retains the custom child inside its stable motion host', () => {
  expect(markup.get('back-top:custom-children')).toContain(
    '<span class="apollo-back-top-custom"><div class="my-content">top</div></span>',
  );
});
