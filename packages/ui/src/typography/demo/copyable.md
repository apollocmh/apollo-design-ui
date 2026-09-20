---
order: 4
title:
  zh-CN: 可复制
  en-US: Copyable
---

`copyable.text` 决定**写进剪贴板**的内容，与显示内容可以不同；它也可以是返回
`Promise<string>` 的函数（异步取文本）。

`tooltips` 与 `icon` 都支持 `[未复制, 已复制]` 二元组。传 `false` 表示**显式不渲染**
（`undefined` 才是「用默认」—— 两者语义不同）。

```vue
<script setup lang="ts">
import { Paragraph, Text } from '@apollo-design/ui';
</script>

<template>
  <Paragraph :copyable="true">Copy me to the clipboard</Paragraph>
  <Paragraph :copyable="{ text: 'Custom copy text' }">Shown text is different from copied text</Paragraph>
  <Paragraph :copyable="{ tooltips: ['Click to copy', 'Copied!'] }">Custom tooltips</Paragraph>
  <Text :copyable="true" />
</template>
```
