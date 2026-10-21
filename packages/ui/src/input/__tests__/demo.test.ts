/**
 * demo 冒烟 —— 10 个示例（Input / TextArea / Password / Search / OTP）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Input', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 24,
});
