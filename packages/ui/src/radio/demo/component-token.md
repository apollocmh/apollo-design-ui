---
order: 12
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

通过 `ConfigProvider :theme="{ components: { Radio: { ... } } }"` 设置当前子树的组件 Token。
示例覆盖尺寸、按钮配色和间距；数值长度会转换为 px，`radioSize` / `dotSize` 保持无单位。
