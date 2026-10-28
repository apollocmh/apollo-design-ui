/**
 * L5 · 无障碍 —— Layout 是纯语义结构：Header/Footer/Content 用原生地标元素
 * （`header` / `footer` / `main`），Sider 是 `aside`；内置触发器使用具名原生 button。
 * axe 扫全部 Demo；真实颜色与交互另由 Layout browser harness 验证。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Layout', {
  global: { stubs: { teleport: false } },
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
});
