---
order: 4
title:
  zh-CN: 排版
  en-US: Layout
---

子元素水平对齐方式：`justify` 取 `start` / `center` / `end` / `space-between` / `space-around` / `space-evenly`。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row justify="space-between">
    <Col :span="4"><div class="demo">col-4</div></Col>
  </Row>
</template>
```
