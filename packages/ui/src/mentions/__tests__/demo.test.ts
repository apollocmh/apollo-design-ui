/**
 * demo 冒烟 —— 16 个示例（与 antd 用户可见 demo 一一对应）。
 *
 * ⚠️ antd 的 `demo/_semantic.tsx` **不落 demo**：它是文档站的语义预览件
 * （依赖 `SemanticPreview` 与 `UnstableContext`），本仓按惯例不搬（见 README §5）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Mentions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 16,
  global: { stubs: { teleport: false } },
});
