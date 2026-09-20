/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 是**防腐断言**：删掉一个 demo 会让「demo 与文档对齐」这句话失效，
 * 而只数「有几个文件」是数不出这件事的。
 *
 * ── 7 个 demo 覆盖的主题 ──────────────────────────────────────────────────────
 *
 * `basic`（`Typography` 本体 + 四个子组件并排）/ `title`（`level` 与 `component`）/
 * `text`（语义色 + 七个装饰）/ `ellipsis`（CSS 单行、多行、`suffix`、`expandable`）/
 * `copyable`（`text` / `onCopy` / 仅图标）/ `editable`（`triggerType` / `onChange`）/
 * `semantic`（`classNames` / `styles`）。
 *
 * ⚠️ 这 7 个是**主题级**的对齐，不是「与 antd 的 `demo/` 目录逐文件 1:1」的断言：
 *    antd 的 npm 产物里**不含** `components/typography/demo/`，离线无法逐文件核对。
 *    所以这里断言的是「我们自己声明了 7 个」，任何增删都必须显式改这个数字。
 *
 * ⚠️ 「不产生告警」对 Typography 有实际约束：demo 里**不能**给 `Text` 传
 *    `ellipsis.expandable` / `ellipsis.rows`（`Text` 会剥掉并告警），
 *    也不能给 `Title` 传非法的 `level`。7 个 demo 都遵守了。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Typography', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
});
