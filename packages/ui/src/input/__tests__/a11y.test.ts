/**
 * L5 · 无障碍 —— 清空按钮 / 密码切换图标均带 aria-label 与 role；
 * input 本体可访问名由 placeholder / 使用方 label 提供（UPSTREAM U13：
 * 与 antd 6.6.4 一致，input 无内置关联 label；全部 demo 均带 placeholder，
 * axe 的 label 规则不需要豁免）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Input', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
