---
order: 1
title:
  zh-CN: 区块间隔
  en-US: Grid Gutter
---

栅格常常需要和间隔进行配合，你可以使用 `Row` 的 `gutter` 属性，我们推荐使用 `(16 + 8n)px` 作为栅格间隔。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="16">
    <Col :span="6"><div class="demo">col-6</div></Col>
  </Row>
</template>
```
