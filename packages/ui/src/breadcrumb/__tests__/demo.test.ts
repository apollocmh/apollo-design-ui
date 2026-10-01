/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/breadcrumb/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：basic / separator / separator-component /
 * withIcon / withParams / overlay / debug-routes，共 **7** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `style-class`（`antd-style` 的 `createStaticStyles`）—— 本仓没有 `antd-style`，
 *   语义化能力已由 `semantic` 视觉用例与 L4 的 `class-names` / `styles` 用例覆盖；
 * - `component-token`（`theme.components.Breadcrumb` 调试）—— 零运行时架构下 token 是构建期产物，
 *   已由 `theme.test.ts` 的「判定值逐条对拍」覆盖。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Breadcrumb', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
  allow: [
    {
      // demo/debug-routes.vue 用的是 **deprecated** 的 `routes` 通道 —— antd 同款告警
      // （那条 demo 的存在意义就是展示「老代码迁移过来会长什么样」）。
      match: '`routes` is deprecated',
      reason:
        'demo/debug-routes.vue 演示 deprecated 的 `routes` 通道（对齐 antd 的同名 demo），本仓保留同款 console.error。',
    },
  ],
});
