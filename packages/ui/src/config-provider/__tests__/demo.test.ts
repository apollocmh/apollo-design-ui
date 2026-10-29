/**
 * demo 冒烟测试：每个 demo 都能渲染且**不产生告警**。
 *
 * `expectCount` 与 `demo/` 下的文件数一一对应。它同时是一条防腐断言：
 * 删掉一个 demo 会让「demo 与实现对齐」这句话失效，而只数「有几个文件」数不出来。
 *
 * 八个 Vue 示例另有真实浏览器交互和默认 / 暗色 / 紧凑 / 组合主题的无障碍验证。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('ConfigProvider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
