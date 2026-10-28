/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载。
 *
 * Current original SFCs: basic / variant / end / title-span / horizontal /
 * alternate / pending / pending-legacy / custom / horizontal-debug / title /
 * style-class / semantic / component-token / native-slots, 15 in total.
 * Browser four-theme/three-viewport and controller checks live in
 * tests/browser/timeline-demos.mjs.
 *
 * ⚠️ **本组件的废弃告警有 7 条**（仅使用旧数据别名时触发）⇒ 必须豁免。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Timeline', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 15,
  // 🚨 上游把 `pending` / `pendingDot` / `mode=left|right` 与四个项级
  //    字段都废弃了 ⇒ 使用这些数据别名时发出 `console.error`。这是**有意的**（`pending-legacy`
  //    demo 的存在就是为了演示废弃 API），不是 demo 写错。
  allow: [
    {
      match: 'is deprecated',
      reason:
        'D91 家族：上游废弃了 `pending` / `pendingDot` / `mode=left|right` 与四个项级字段；本仓保留同款告警，demo 用到即有。',
    },
  ],
});
