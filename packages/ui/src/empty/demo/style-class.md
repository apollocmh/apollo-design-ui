---
order: 5
title:
  zh-CN: 语义化类名与样式
  en-US: Style & Class
---

`classNames` / `styles` 各有四个槽位：`root` / `image` / `description` / `footer`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。

合并优先级（低 → 高）：ConfigProvider → 组件 prop。其中 `style` 会**覆盖** `styles.root`。

```vue
<script setup lang="ts">
import { Empty } from '@apollo-design/ui';

const classNames = { root: 'demo-empty-root', image: 'demo-empty-image' };
const styles = { root: { backgroundColor: '#fafafa' } };
</script>

<template>
  <Empty :class-names="classNames" :styles="styles" description="带语义化类名与样式">
    <button type="button">Create</button>
  </Empty>
</template>
```
