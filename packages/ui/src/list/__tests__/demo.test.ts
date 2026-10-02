/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/list/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：basic / simple / vertical / grid / responsive /
 * loadmore / pagination / spin-debug，共 **8** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `component-token`（`theme.components.List` 调试）—— 零运行时架构下 token 是构建期产物，
 *   已由 `theme.test.ts` 覆盖。**全仓 10+ 组件同判**。
 * - `drag-sorting` / `drag-sorting-handler` / `grid-drag-sorting` /
 *   `grid-drag-sorting-handler`（4 个）—— 依赖 **`dnd-kit`**（非 antd 自带依赖，
 *   `package.json` 里没有）⇒ 未移植。
 * - `infinite-load` —— 依赖 `IntersectionObserver` + 真实网络请求；
 *   本仓的滚动/观察类能力由 `virtual-list` foundation 覆盖，未单独移植。
 * - `virtual-list` —— antd 的这个 demo 用的是 **`Listy`**（`virtual` 模式），
 *   而 `Listy` 在本仓已作为**独立组件**完成（`listy/`），不重复。
 * - `grid-test` —— 上游的内部调试 demo（不在用户文档侧栏）。
 *
 * ⚠️ **本组件的告警**：`List` 在 antd 6.6.4 里整体 deprecated ⇒ 每个 demo 渲染时
 * 都会发一条 `console.error`。`demoTest` 的「不产生告警」约定因此**必须豁免**这一条
 * （见下方 `allow`）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('List', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
  // 🚨 上游把 `List` 整体废弃了（D91 先例：本仓保留同款告警）⇒ 每个 demo 都会发。
  //    这是**有意的**，不是 demo 写错。
  allow: [
    {
      match: 'The `List` component is deprecated',
      reason: 'D91 家族：组件整体 deprecated，demo 用到即有同款告警（上游行为）。',
    },
  ],
});
