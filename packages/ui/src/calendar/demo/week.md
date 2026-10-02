---
order: 7
title:
  zh-CN: 周数
  en-US: Show Week
---

通过将 `showWeek` 属性设置为 `true`，在全屏日历中显示周数。

```vue
<script setup lang="ts">
// 对齐 antd 的 week demo：全屏与迷你两种形态都开 `showWeek`。

import { Calendar } from '@apollo-design/ui';
</script>

<template>
  <Calendar :fullscreen="true" :show-week="true" />
  <br />
  <Calendar :fullscreen="false" :show-week="true" />
</template>
```
