---
order: 6
title:
  zh-CN: 排序
  en-US: Order
---

通过 `order` 改变元素的排序。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="6" :order="3"><div class="demo">col-order-3</div></Col>
  </Row>
</template>
```
