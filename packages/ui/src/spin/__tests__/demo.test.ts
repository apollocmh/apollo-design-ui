/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 `components/spin/demo/` 的**用户可见** demo 一一对应（9 个）：
 * basic / size / nested / tip（我们的 `description`）/ delayAndDebounce / custom-indicator /
 * percent / style-class / fullscreen。
 *
 * 上游另有 `list-debug.tsx`（`<code src=... debug>`）与 `_semantic.tsx`（语义 DOM 演示），
 * 两者都**不是**用户 demo：前者是调试用，后者的对应物是 `__tests__/semantic.test.ts`
 * 的 L4 契约。所以它们不计入 `expectCount`。
 *
 * 它同时是一条防腐断言：删掉一个 demo 会让「demo 与 antd 对齐」这句话失效，
 * 而只数「有几个文件」是数不出这件事的。
 *
 * ⚠️ 「不产生告警」对 Spin 有实际约束：demo 里**不能**用已废弃的 `tip` /
 *    `wrapperClassName` / `size="default"`，也不能用已废弃的 `classNames.tip` /
 *    `classNames.mask` 槽位。上表 9 个 demo 都遵守了 —— 其中
 *    `description.vue` 用的是 `description`，`style-class.vue` 用的是
 *    `description` / `container` / `indicator` 槽位。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Spin', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
