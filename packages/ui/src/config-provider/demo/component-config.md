---
order: 3
title:
  zh-CN: 组件级配置
  en-US: Component config
---

精确别名 empty / divider / spin / form 与 components map 共用当前配置链。map 的键和字段以各组件支持的配置为准，不等于自动应用全部组件 props。

嵌套时不同组件名继承，同名配置整体替换；直接别名优先于同名 map 项，组件自身显式 props 最优先。示例同时展示 Empty / Divider 的语义样式与 components.button.shape。
