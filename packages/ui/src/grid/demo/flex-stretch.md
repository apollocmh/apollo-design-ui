---
order: 7
title:
  zh-CN: Flex 填充
  en-US: Flex Stretch
---

`Col` 配合 `flex` 样式实现内容填充。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="8"><div class="demo">col-8</div></Col>
  </Row>
</template>
```
