---
order: 200
title:
  zh-CN: 组件 Token
  en-US: Component tokens
---

通过当前 `theme.components.Alert` 设置圆角、普通内边距、带描述内边距和描述图标尺寸。切换回默认值时移除覆盖，输入值与焦点随原生节点保留。根元素显式 `--apollo-alert-*` 变量仍优先于 Provider；默认与紧凑算法的内边距来自当前 Alias Token。

Use the current `theme.components.Alert` values for all four tokens. Removing the overrides restores the source theme without remounting the editor. Explicit root CSS variables take precedence over Provider tokens.
