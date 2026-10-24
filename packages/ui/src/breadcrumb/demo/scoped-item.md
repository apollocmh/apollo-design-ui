---
order: 10
title:
  zh-CN: 原生作用域与子组件
  en-US: Native scoped items and children
---

`#itemRender` 接收单个对象，包括当前路由、逐项路径与已解析的 href。可动态添加或移除插槽，空内容不回退。原生子组件按 Vue key 保留重排后的输入状态。

<!-- en-US -->

The item slot receives one named object with the current route, per-item paths and resolved href. Conditional and empty slots update normally. Native child composition preserves keyed input state during reorder.
