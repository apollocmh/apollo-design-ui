---
order: 10
title:
  zh-CN: 其他属性的响应式
  en-US: Responsive More
---

`span` / `offset` 等属性均支持响应式对象写法。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :xs="{ span: 20, offset: 2 }" :lg="{ span: 8, offset: 4 }"><div class="demo">Col</div></Col>
  </Row>
</template>
```
