---
order: 4
title:
  zh-CN: 垂直分割线
  en-US: Vertical
---

`orientation="vertical"` 与 `vertical` 等价，同时配置时以 `orientation` 优先。

⚠️ 垂直模式下**不能带标题**：`children` 会被忽略并输出告警（与 antd 一致）。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  Text
  <Divider orientation="vertical" />
  <a href="#" aria-label="Apollo Design component examples">Link</a>
  <Divider vertical />
  <a href="#" aria-label="Apollo Design component examples">Link</a>
</template>
```
