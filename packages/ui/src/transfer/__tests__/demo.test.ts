/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 `components/transfer/demo/` 的用户可见 demo 一一对应
 * （本批收口 8 个）：basic / search / oneway / advanced / pagination / custom-item /
 * status / custom-select-all-labels。
 *
 * 2026-10-04 补齐上游的 `table-transfer` / `tree-transfer`（renderList 通道，
 * 依赖 Table / Tree），expectCount 8 → 10。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Transfer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
});
