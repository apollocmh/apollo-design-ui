/**
 * 当前 Apollo 示例冒烟；图片使用 data URI，避免外网资源影响回归。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Image', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 17,
  global: { stubs: { teleport: false } },
});
