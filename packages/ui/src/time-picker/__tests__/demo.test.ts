/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生意外告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/time-picker/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批，共 **14** 个：
 * `basic` / `addon` / `change-on-scroll` / `colored-popup` / `disabled` / `hide-column` /
 * `need-confirm` / `range-picker` / `size` / `status` / `style-class` / `suffix` /
 * `value` / `variant`。
 *
 * ── ⚠️ 与 antd 的**差距**（3 个未移植，缺口登记在 `README.md` §5）────────────────
 *
 * | 上游 demo | 为什么不移植 |
 * |---|---|
 * | `12hours` | 依赖**顶层** `use12Hours` —— 本仓静默失效（README §5 第 5 条 / PITFALLS 317） |
 * | `interval-options` | 依赖顶层 `hourStep` / `minuteStep` / `secondStep` —— 同上 |
 * | `render-panel` | 依赖 `_InternalPanelDoNotUseOrYouWillBeFired`（`PurePanel`）—— 本仓未落地 |
 * | `_semantic` | 上游的**内部**演示件（不在用户文档侧栏） |
 *
 * ── 告警豁免 ────────────────────────────────────────────────────────────────
 *
 * ⚠️ **本组件刻意没有豁免**：上游会发废弃告警的三个 prop（`addon` / `popupClassName` /
 * `popupStyle`）在 demo 里**一个都没用**（`addon` demo 走的是它的替代品
 * `renderExtraFooter`）⇒ 「无意外告警」这条对 14 个 demo 是**真的**成立。
 * ⚠️ 一旦将来有人补了 `addon` demo，必须在这里登记豁免并写明理由 ——
 * 不允许默默加豁免。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('TimePicker', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});
