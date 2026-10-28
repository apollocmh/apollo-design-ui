/** Every paired Breadcrumb demo mounts, updates and unmounts without unexpected warnings. */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Breadcrumb', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
  allow: [
    {
      // demo/debug-routes.vue 用的是 **deprecated** 的 `routes` 通道 —— antd 同款告警
      // （那条 demo 的存在意义就是展示「老代码迁移过来会长什么样」）。
      match: '`routes` is deprecated',
      reason:
        'demo/debug-routes.vue 演示 deprecated 的 `routes` 通道（对齐 antd 的同名 demo），本仓保留同款 console.error。',
    },
  ],
});
