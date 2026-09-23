/**
 * demo 冒烟测试：7 个 demo 与 antd 非 debug demo 一一对应
 * （basic / autoplay / fade / arrows / position / drag / component-token）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Carousel', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
});
