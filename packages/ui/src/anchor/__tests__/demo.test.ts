/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/anchor/demo/` 的**用户可见** demo 一一对应
 * 中本仓**已落地**的那批：basic / horizontal / onChange / onClick / replace /
 * targetOffset / targetOffset-per-link / customizeHighlight，共 **8** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `static`（`affix={false}` + 状态不随滚动变化）—— 与 `basic` 的差别只在滚动行为，
 *   而 jsdom 测不到滚动 ⇒ 留给 L6；
 * - `legacy-anchor`（deprecated 的 children 路径）—— 本仓用默认插槽表达，
 *   已由 L4 的 `anchor:children` 用例覆盖；
 * - `style-class`（antd-style 的 `createStaticStyles`）—— 本仓没有 `antd-style`；
 * - `component-token`（`theme.components.Anchor` 调试）—— 零运行时架构下 token 是构建期产物。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Anchor', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
