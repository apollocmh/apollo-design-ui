/**
 * L5 · 无障碍 —— Statistic 无交互语义（纯展示组件），axe 扫全部 demo。
 *
 * 上游语义：根 div 无 role（用户可自行传 role，L4 基线已钉 aria/data 透传）。
 * Timer 是文本更新而非 aria-live（antd 同判，逐字保留）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Statistic', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
