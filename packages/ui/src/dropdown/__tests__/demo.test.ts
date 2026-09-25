/**
 * demo 冒烟 —— 19 个示例（与 antd 用户可见 demo 一一对应；item 的 label 锚点
 * 简化为纯文本，语义等价，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Dropdown', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 19,
  global: { stubs: { teleport: false } },
  allow: [
    {
      // demo/dropdown-button.vue 使用 deprecated 的 DropdownButton —— antd 同款告警
      // （D91：组件整体 deprecated，本仓保留同款 console.error）。
      match: '`Dropdown.Button` is deprecated',
      reason:
        'demo/dropdown-button.vue 使用 deprecated 的 DropdownButton（antd 同款告警，D91：组件整体 deprecated，本仓保留同款 console.error）。',
    },
  ],
});
