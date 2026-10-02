---
order: 3
title:
  zh-CN: 更灵活的内容展示
  en-US: Flexible content
---

可以利用 `Card.Meta` 支持更灵活的内容。

⚠️ 封面用 **data URI** 而不是外网图片（与 `image` / `avatar` 的 demo 同判：外网图片会污染 L6 基线）。

```vue
<script setup lang="ts">
// 对齐 antd 的 flexible-content demo。
import { Card, CardMeta } from '@apollo-design/ui';
import { h } from 'vue';

const COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const cover = () => h('img', { draggable: false, alt: 'example', src: COVER });
</script>

<template>
  <Card hoverable variant="borderless" :style="{ width: '240px' }" :cover="cover()">
    <CardMeta title="Europe Street beat" description="www.instagram.com" />
  </Card>
</template>
```
