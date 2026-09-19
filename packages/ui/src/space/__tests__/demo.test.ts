/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/space/demo/` 的**用户可见** demo 一一对应（15 个）：
 * base / vertical / size / align / wrap / separator / compact / compact-buttons /
 * compact-button-vertical / compact-nested / compact-debug / debug / gap-in-line /
 * style-class / component-token。上游另有 `_semantic.tsx`（语义 DOM 演示），它不是用户 demo，
 * 我们的对应物是 `__tests__/semantic.test.ts` 的 L4 契约。
 *
 * 它同时是一条防腐断言：删掉一个 demo 会让「demo 与 antd 一一对应」这句话失效
 * （`WORKFLOW.md` G11），而只数「有几个文件」是数不出这件事的。
 *
 * ⚠️ **「不产生告警」对 Space 有实际约束**：demo 里**不能**用已废弃的 `direction` / `split`。
 *    上表 15 个 demo 都遵守了（`direction` 的告警由 `index.test.ts` 单独钉住）。
 *
 * ⚠️ 8 个 demo 用原生 `<button>` / `<input>` / `<select>` **替身**替代尚未实现的
 *    Button / Input / Select / Card / Typography（Space 在 DAG 上先于它们）。
 *    替身样式在 `demo/_standin.ts`，缺口登记在 `README.md` §7。
 *    这不是「demo 与 antd 不一致」—— 演示的**行为**逐条对应，只有承载它的元素换了。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Space', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 15,
});
