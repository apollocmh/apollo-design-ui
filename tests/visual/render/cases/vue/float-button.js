/**
 * Vue 侧（@apollo-design/ui）的 FloatButton 视觉用例。与 react/float-button.jsx 逐条对应。
 * basic（icon-only + primary）/ shape-content（square + #content）/ badge-tooltip。
 *
 * ⚠️ 与 React 侧**同判**：三条全部走 `FloatButtonPurePanel`（antd 的
 *    `_InternalPanelDoNotUseOrYouWillBeFired`），因为 `-individual` 是 `position: fixed`
 *    ⇒ 落在截图目标 `#stage` 之外 ⇒ 截图全白、变体空转（`KNOWN-ISSUES §1.10`）。
 *    理由全文见 `react/float-button.jsx` 的文件头。
 */

import { FloatButtonPurePanel } from '@apollo-design/ui';
import { h } from 'vue';

const Pure = FloatButtonPurePanel;

const box = (children) =>
  h('div', { style: { minHeight: '120px', padding: '16px', width: '480px' } }, children);

export default {
  basic: () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px' } }, [
        h(Pure),
        h(Pure, { type: 'primary' }),
        h(Pure, { shape: 'square' }),
      ]),
    ),

  'shape-content': () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px', alignItems: 'flex-start' } }, [
        h(Pure, { shape: 'square' }, { content: () => 'HELP INFO' }),
        h(
          Pure,
          { shape: 'square' },
          {
            icon: () => h('span', { style: { fontSize: '14px' } }, '?'),
            content: () => 'HELP',
          },
        ),
      ]),
    ),

  'badge-tooltip': () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px' } }, [
        h(Pure, { badge: { dot: true } }),
        h(Pure, { badge: { count: 5 } }),
        h(Pure, { tooltip: 'title text' }),
      ]),
    ),
};
