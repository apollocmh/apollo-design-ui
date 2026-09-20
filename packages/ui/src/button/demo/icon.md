---
order: 7
title:
  zh-CN: 图标按钮
  en-US: Icon
---

`icon` 在 v6 里是 **VNode**，不是 v4 的字符串名（传字符串且长度 > 2 会输出告警）。

- `icon` prop 与 `icon` 插槽都能传图标，**prop 优先**（`props.icon ?? slots.icon()`）。
- `iconPlacement="end"` 把图标放到文字后面（靠 `-icon-end` 类名用 CSS 翻转，
  **不是**调换 DOM 顺序）。
- 没有默认插槽且有图标时加 `-icon-only` 类名。
- `loading` 时图标换成加载图标（`loading.icon` > ConfigProvider 的 `loadingIcon` > 内置 `LoadingOutlined`），
  容器上额外带 `-loading-icon` 类名。
- `loading` 时图标换成加载图标（`loading.icon` > ConfigProvider 的 `loadingIcon` > 内置 `LoadingOutlined`），
  容器上额外带 `-loading-icon` 类名。

```vue
<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" :icon="SearchOutlined">Search</Button>
</template>
```
