/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/avatar/demo/` 的**用户可见** demo
 * 一一对应中本仓**已落地**的那批：basic / type / dynamic / badge / group / max-count /
 * fallback / toggle-debug / responsive，共 **9** 个。
 *
 * ⚠️ 与 antd 的**差距**（缺口登记在 `README.md` §5）：
 * - `component-token`（`theme.components.Avatar` 调试）—— 零运行时架构下 token 是构建期产物，
 *   已由 `theme.test.ts` 的「判定值逐条对拍 + 声明↔引用双向检查」覆盖。
 *
 * ⚠️ 本组件的 demo **不产生任何告警**（`Avatar` 的 `icon` 字符串告警与
 * `Avatar.Group` 的四条 deprecated 告警在 demo 里都没被触发）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Avatar', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
