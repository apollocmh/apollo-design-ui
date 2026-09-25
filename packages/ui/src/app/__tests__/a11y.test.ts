/** L5 · 无障碍 —— App 本身无 aria 面（纯容器）；axe 扫 demo。 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('App', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 2,
});
