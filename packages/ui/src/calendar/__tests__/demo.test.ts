/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生意外告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/calendar/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批，共 **8** 个：
 * `basic` / `card` / `customize-header` / `event-range` / `notice-calendar` /
 * `select` / `style-class` / `week`。
 *
 * ── ⚠️ 与 antd 的**差距**（2 个未移植，缺口登记在 `README.md` §5）────────────────
 *
 * | 上游 demo | 为什么不移植 |
 * |---|---|
 * | `lunar` | 需要第三方 `lunar-typescript`（本仓未安装，且它只为这一个 demo 服务） |
 * | `component-token` | 用 `theme.components.Calendar` 调试 token —— 与全仓 10+ 组件同判（零运行时架构下 token 是构建期产物） |
 * | `_semantic` | 上游的**内部**演示件（不在用户文档侧栏） |
 *
 * ── 告警豁免 ────────────────────────────────────────────────────────────────
 *
 * ⚠️ **本组件刻意没有豁免**。
 *
 * 🚨 这里曾经写过两条 `dateCellRender` / `monthCellRender` 的废弃告警豁免 ——
 * **是错的**：`notice-calendar` 里那两个名字只是**局部函数**，真正传给 `Calendar` 的
 * 只有 `cellRender`（上游 demo 也是这么写的）⇒ **一条废弃告警都不会发**。
 * 那两条豁免会被 harness 的「未被命中的豁免会让测试失败（防腐烂）」抓住 ——
 * 这正是它存在的意义。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Calendar', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
