/**
 * demo 冒烟测试：每个 demo 都能渲染且**不产生告警**。
 *
 * `expectCount` 与 `demo/` 下的文件数一一对应。它同时是一条防腐断言：
 * 删掉一个 demo 会让「demo 与实现对齐」这句话失效，而只数「有几个文件」数不出来。
 *
 * ⚠️ antd 的 `config-provider/demo/` 有 9 组（direction / holderRender / locale /
 *    prefixCls / size / theme / useConfig / wave / warning），其中
 *    `holderRender` 是 React 特有（D30）、`wave` / `warning` 没有下游消费者
 *    ⇒ 本仓 5 个 demo 不是「少做」，而是「只做有东西可展示的」。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('ConfigProvider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 5,
});
