---
order: 1
title:
  zh-CN: 垂直间距
  en-US: Vertical
---

相邻组件垂直间距。

`orientation="vertical"` 与 `vertical` 等价；同时配置时以 `orientation` 优先。
⚠️ 垂直模式下 `align` 不传时**不产生** `-align-*` 类名（与水平模式的默认 `center` 不同）。

```vue
<script setup lang="ts">
import { Space } from '@apollo-design/ui';
import { CARD, CARD_BODY, CARD_HEAD } from './_standin';
</script>

<template>
  <Space orientation="vertical" size="medium" :style="{ display: 'flex' }">
    <div v-for="i in 3" :key="i" :style="CARD">
      <div :style="CARD_HEAD">Card</div>
      <div :style="CARD_BODY">
        <p>Card content</p>
        <p>Card content</p>
      </div>
    </div>
  </Space>
</template>
```
