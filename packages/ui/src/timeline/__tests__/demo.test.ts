/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/timeline/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：basic / variant / end / title-span / horizontal /
 * alternate / pending / pending-legacy / custom / horizontal-debug / title /
 * style-class / semantic，共 **13** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `component-token`（`theme.components.Timeline` 调试）—— 零运行时架构下 token 是构建期
 *   产物，已由 `theme.test.ts` 覆盖。**全仓 10+ 组件同判**。
 * - `_semantic` / `_semantic_items` —— 上游的**内部**演示件（不在用户文档侧栏）。
 *
 * ⚠️ **本组件的废弃告警有 7 条**（挂载即发）⇒ 必须豁免。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Timeline', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
  // 🚨 上游把 `Timeline.Item` / `pending` / `pendingDot` / `mode=left|right` 与四个项级
  //    字段都废弃了 ⇒ 挂载即发多条 `console.error`。这是**有意的**（`pending-legacy`
  //    demo 的存在就是为了演示废弃 API），不是 demo 写错。
  allow: [
    {
      match: 'is deprecated',
      reason:
        'D91 家族：上游废弃了 `Timeline.Item` / `pending` / `pendingDot` / `mode=left|right` 与四个项级字段；本仓保留同款告警，demo 用到即有。',
    },
  ],
});
