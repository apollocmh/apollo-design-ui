---
order: 5
title:
  zh-CN: 分隔符
  en-US: Separator
---

通过 `#separator` 使用 Divider；分隔符插槽优先于 separator/split 数据，故意留空可以隐藏。

Use Divider through #separator; a present slot takes priority over separator/split data, including intentional empty content.

```vue
<script setup lang="ts">
import { Divider, Space } from '@apollo-design/ui';
</script>
<template>
  <Space><template #separator><Divider orientation="vertical" /></template><a href="#first">First link</a><a href="#second">Second link</a><a href="#third">Third link</a></Space>
</template>
<style scoped>a { color: inherit; text-decoration: underline; }</style>
```
