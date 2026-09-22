/**
 * L5 · 无障碍 —— CheckableTag 的 checkbox 语义、close-icon 的 button 语义；
 * axe 扫全部 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Tag', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
});
