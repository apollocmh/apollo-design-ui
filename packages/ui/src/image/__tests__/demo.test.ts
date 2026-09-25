/**
 * demo 冒烟 —— 14 个示例（与 antd 用户可见 demo 一一对应；图片用 data URI ——
 * 外网图片会污染 L6 基线，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Image', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});
