---
order: 7
title:
  zh-CN: 图标按钮
  en-US: Icon
---

`icon` 在 v6 里是**节点**，不是 v4 的字符串名（传字符串且长度 > 2 会输出告警）。
也可以传**组件** —— Vue 没有 React 的「元素」形态，对应物就是组件本身（差异 D42）。

- `icon` prop 与 `icon` 插槽都能传图标，**prop 优先**（`props.icon ?? slots.icon()`）。
- `iconPlacement="end"` 把图标放到文字后面（靠 `-icon-end` 类名用 CSS 翻转，
  **不是**调换 DOM 顺序）。
- 没有默认插槽且有图标时加 `-icon-only` 类名。
- `loading` 时图标换成加载图标（`loading.icon` > ConfigProvider 的 `loadingIcon` > 内置 `LoadingOutlined`）。
  容器上额外带 `-loading-icon` 类名 —— ⚠️ **只在前两支都没提供自定义图标时才带**；
  一旦有自定义加载图标（prop 或 ConfigProvider），该类名**不出现**。
- 插槽仍只接受 `() => VNodeChild`；组件要走 prop。

```vue
<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button } from '@apollo-design/ui';
import { h } from 'vue';
</script>

<template>
  <!-- 组件形态：与 antd 的 `icon={<SearchOutlined />}` 等价（差异 D42） -->
  <Button type="primary" :icon="SearchOutlined">Search</Button>
  <!-- VNode 形态：`h(SearchOutlined)` 渲染结果一致 -->
  <Button type="primary" :icon="h(SearchOutlined)">Search</Button>
  <!-- 插槽形态 -->
  <Button type="primary">
    <template #icon><SearchOutlined /></template>
    Slot icon
  </Button>
</template>
```
