/**
 * L5 · 无障碍 —— Watermark 是纯装饰层：水印 div 无 ARIA 语义（也不该有，
 * 它是重复的背景图案），`pointer-events: none` 保证不挡交互。
 *
 * axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Watermark', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
