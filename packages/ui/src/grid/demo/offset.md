---
order: 2
title:
  zh-CN: 左右偏移
  en-US: Grid Offset
---

使用 `offset` 可以将列向右侧偏移。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="8"><div class="demo">col-8</div></Col>
    <Col :span="8" :offset="8"><div class="demo">col-8</div></Col>
  </Row>
</template>
```
