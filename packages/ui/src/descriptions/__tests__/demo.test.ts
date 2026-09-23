/**
 * demo 冒烟测试：6 个 demo（basic / bordered / vertical / size / extra / custom-item）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Descriptions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
