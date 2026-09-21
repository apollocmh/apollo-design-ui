---
order: 1
title:
  zh-CN: 基础
  en-US: Basic
---

最简单的用法：滚动到 `offsetTop` 之后，按钮固钉在顶部。

固钉时组件会渲染一个**等高占位层**（`aria-hidden`），避免页面布局跳动；
且**只有此时**内层才有 `apollo-affix` 类名（`position: fixed`）。

```vue
<script setup lang="ts">
import { Affix, Button } from '@apollo-design/ui';
</script>

<template>
  <Affix :offset-top="80">
    <Button type="primary">固定在顶部 80px</Button>
  </Affix>
</template>
```
