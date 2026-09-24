/**
 * demo 冒烟 —— 8 个示例（本轮范围：Input / TextArea / Password）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Input', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
