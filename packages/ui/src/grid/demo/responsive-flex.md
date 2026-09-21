---
order: 9
title:
  zh-CN: Flex 响应式布局
  en-US: Responsive Flex
---

`Col` 的 `flex` 与 `Row` 的 `gutter` 均支持响应式对象写法。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="{ xs: 8, sm: 16, md: 24 }">
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }"><div class="demo">Flex col</div></Col>
  </Row>
</template>
```
