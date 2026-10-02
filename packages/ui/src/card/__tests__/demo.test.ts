/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/card/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：basic / borderLess / simple / flexibleContent /
 * inColumn / loading / gridCard / inner / tabs / meta，共 **10** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `style-class`（`antd-style` 的 `createStaticStyles`）—— 本仓没有 `antd-style`，
 *   语义化能力已由 L4 的 `class-names` / `styles` 用例与 L6 的 `semantic` 变体覆盖；
 * - `component-token`（`theme.components.Card` 调试）—— 零运行时架构下 token 是构建期产物，
 *   已由 `theme.test.ts` 的「判定值逐条对拍 + 声明↔引用双向检查」覆盖；
 * - `no-body-debug` / `button-alignment-debug`（上游标了 `debug`，不在文档正文里）；
 * - `_semantic` / `_semantic_meta`（文档的「语义化 DOM」示意，`simplify` 专用）。
 *
 * ⚠️ 本组件的 demo **不产生任何告警**（4 条 deprecated 告警的 prop 一个都没用到）
 * ⇒ `allow` 为空。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Card', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
});
