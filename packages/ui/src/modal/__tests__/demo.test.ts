/**
 * demo 冒烟 —— 23 个示例（对齐 antd `components/modal/demo/*.md` 的 23 个清单；
 * 其中 `dark` / `modal-render` 因依赖外部库做了意图等价的简化，各自文件头有登记）。
 *
 * 「不产生告警」是 demo 的硬约束（`demoTest` 会断言 console 干净）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Modal', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 23,
  global: { stubs: { teleport: false } },
});
