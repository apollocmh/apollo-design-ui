---
order: 7
title:
  zh-CN: 内部卡片
  en-US: Inner card
---

可以放在普通卡片内部，展示多层级结构的信息。

`type="inner"` 时根上加 `-type-inner`：head 背景变 `colorFillAlter`、字号降一档、
body 的上下 padding 变成 `padding`（左右仍是 `bodyPadding`）。

```vue
<script setup lang="ts">
// 对齐 antd 的 inner demo。
import { Card } from '@apollo-design/ui';
import { h } from 'vue';

const more = () => h('a', { href: '#' }, 'More');
</script>

<template>
  <Card title="Card title">
    <Card type="inner" title="Inner Card title" :extra="more()">Inner Card content</Card>
    <Card
      :style="{ marginTop: '16px' }"
      type="inner"
      title="Inner Card title"
      :extra="more()"
    >
      Inner Card content
    </Card>
  </Card>
</template>
```
