---
order: 0
title:
  zh-CN: 基础
  en-US: Basic
---

`Title` / `Paragraph` / `Text` / `Link` 四件套是最常见的排版组合。

```vue
<script setup lang="ts">
import { Link, Paragraph, Text, Title } from '@apollo-design/ui';
</script>

<template>
  <Title>Introduction</Title>
  <Paragraph>
    In the process of internal desktop applications development, many different design specs and
    implementations would be involved.
    <Text strong>It is a long established fact</Text>
    that a reader will be distracted by the readable content of a page when looking at its layout.
  </Paragraph>
  <Paragraph>
    <Text>Read more in </Text>
    <Link href="https://apollo.design" target="_blank">Apollo Design</Link>.
  </Paragraph>
</template>
```
