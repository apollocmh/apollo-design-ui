/**
 * demo 冒烟 —— 3 个示例（basic / picture-card / dragger）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Upload', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 3,
});
