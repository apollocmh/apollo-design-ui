/**
 * Vue 侧（@apollo-design/ui）的 Progress 视觉用例。与 react/progress.jsx 逐条对应。
 * line-states（四态 + 隐藏）/ circle-dashboard（三态 + 仪表盘）/ gradient-success。
 *
 * ⚠️ 两侧必须**同构**：react 侧用 antd 的 `<Flex>` 排版 ⇒ 这里必须用本仓的
 * `Flex`（不能用内联样式 div 顶替 —— dom-probe 会报结构差异：
 * `ant-flex*` vs 空 class）。2026-10-08 修正。
 */

import { Flex, Progress } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '120px', padding: '16px', width: '480px' } }, children);

export default {
  'line-states': () =>
    box(
      h(Flex, { gap: 'small', vertical: true }, () => [
        h(Progress, { percent: 30 }),
        h(Progress, { percent: 50, status: 'active' }),
        h(Progress, { percent: 70, status: 'exception' }),
        h(Progress, { percent: 100 }),
        h(Progress, { percent: 50, showInfo: false }),
      ]),
    ),

  'circle-dashboard': () =>
    box(
      h(Flex, { gap: 'small', wrap: true }, () => [
        h(Progress, { type: 'circle', percent: 75 }),
        h(Progress, { type: 'circle', percent: 70, status: 'exception' }),
        h(Progress, { type: 'circle', percent: 100 }),
        h(Progress, { type: 'dashboard', percent: 75 }),
      ]),
    ),

  'gradient-success': () =>
    box(
      h(Flex, { gap: 'small', vertical: true }, () => [
        h(Progress, {
          percent: 60,
          success: { percent: 20 },
          strokeColor: { from: '#108ee9', to: '#87d068' },
        }),
        h(Progress, { percent: 99.9, strokeColor: { '0%': '#108ee9', '100%': '#87d068' } }),
        h(Progress, { percent: 60, steps: 5 }),
      ]),
    ),
};
