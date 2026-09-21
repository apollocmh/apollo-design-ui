/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/flex/demo/` 的**用户可见** demo 一一对应
 * （basic / align / gap / wrap / combination），外加 docs 里标记 `debug` 的调试 demo ——
 * 共 6 个。antd 的 demo 依赖 Radio.Group / Segmented / Card / Typography / Slider，
 * 其中未落地的组件用原生元素等价替换（缺口登记在 `README.md` §7）；
 * 「不产生告警」对替换后的 demo 依然是硬约束。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Flex', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
