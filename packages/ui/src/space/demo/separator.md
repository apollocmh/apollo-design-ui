---
order: 5
title:
  zh-CN: 分隔符
  en-US: Separator
---

相邻组件分隔符。`separator` 接受任意节点，所以可以放 `Divider` 这类组件。

⚠️ `separator` 为**假值**（`0` / `''` / `null`）时**不渲染**分隔符 —— 判据是真值，不是 `??`。
`split` 是它的废弃别名（`mergedSeparator = separator ?? split`），传它会输出开发期告警。

```vue
<script setup lang="ts">
import { h } from 'vue';
import { Divider, Space } from '@apollo-design/ui';
import { LINK } from './_standin';
</script>

<template>
  <Space :separator="h(Divider, { orientation: 'vertical' })">
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
  </Space>
</template>
```
