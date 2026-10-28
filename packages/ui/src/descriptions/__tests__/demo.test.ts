/**
 * demo 冒烟测试：全部 13 个配对 demo。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Descriptions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
