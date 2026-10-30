/**
 * 当前 Demo 可加载且无运行时告警；条数断言防止有效场景被遗漏。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Form', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 35,
});
