---
order: 1
title:
  zh-CN: 区块间隔
  en-US: Grid Gutter
---

`gutter` 支持零、分数、CSS 长度和 `[水平, 纵向]`。两个轴都可以独立配置断点。示例色块使用主题背景和文字变量，保持明暗主题中的可读性。

Both axes accept responsive maps, including zero and fractional spacing.

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="[{ xs: 8, md: 24 }, { xs: 8, md: 16 }]">
    <Col :span="6"><div class="demo">col-6</div></Col>
  </Row>
</template>
```
