---
order: 4
title:
  zh-CN: 全局配置
  en-US: ConfigProvider
---

`ConfigProvider` 的 `empty` 配置可以统一提供 `image` / `className` / `style` / `classNames` / `styles`，
组件自身的 prop 优先级更高。

⚠️ 本仓库的 `ConfigProvider` **组件**尚未实现（走它自己的 G0→G14），当前只能直接
`provide(configContextKey, ...)` —— 这正是 ConfigProvider 未来会做的事。

```vue
<script setup lang="ts">
import { configContextKey, DEFAULT_CONFIG_CONTEXT, Empty } from '@apollo-design/ui';
import { provide } from 'vue';

provide(configContextKey, {
  ...DEFAULT_CONFIG_CONTEXT,
  components: { empty: { image: 'https://example.com/empty.svg' } },
});
</script>

<template>
  <Empty description="ConfigProvider 提供了默认插画" />
</template>
```
