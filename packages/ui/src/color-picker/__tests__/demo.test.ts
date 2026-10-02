/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/color-picker/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：base / size / controlled / line-gradient / text-render /
 * disabled / disabled-alpha / allowClear / trigger / trigger-event / format / presets /
 * presets-line-gradient / panel-render / style-class / pure-panel，共 **16** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `_semantic`（上游的「语义化 DOM」示意 demo，`simplify` 专用，不在文档正文里）
 *   —— 本仓不落地；语义槽的覆盖已由 `semantic.test.ts` 承担。
 * - 上游 demo 里用到的 `antd-style` / `theme.useToken()` / `@ant-design/colors` /
 *   `@ant-design/icons` 本仓没有（或换成本仓同名物），逐个做了**等值替换**并登记
 *   在 `README.md` §5。
 *
 * ⚠️ 本组件的 demo **不产生任何告警** ⇒ `allow` 为空。
 * （`disabled-alpha` demo 用**不透明**色，因此不会触发上游同款的
 * 「`disabledAlpha` 会把 alpha 强制为 100%」告警。）
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('ColorPicker', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 16,
  // 浮层走 Teleport：VTU 的 teleport-stub 会在 props 翻转时重建 slot 内容，
  // 破坏 Portal 的残骸协议（见 test-utils 的 `RenderSource.global` 说明）。
  global: { stubs: { teleport: false } },
});
