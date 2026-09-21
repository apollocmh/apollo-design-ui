---
order: 5
title:
  zh-CN: 对齐
  en-US: Alignment
---

子元素垂直对齐方式：`align` 取 `top` / `middle` / `bottom`。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row align="middle" style="height: 80px">
    <Col :span="4"><div class="demo">col-4</div></Col>
  </Row>
</template>
```
