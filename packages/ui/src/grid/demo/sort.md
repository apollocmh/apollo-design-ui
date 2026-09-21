---
order: 3
title:
  zh-CN: 栅格排序
  en-US: Grid Sort
---

列排序。使用 `push`（右移）和 `pull`（左移）改变列的顺序。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="18" :push="6"><div class="demo">col-18 col-push-6</div></Col>
    <Col :span="6" :pull="18"><div class="demo">col-6 col-pull-18</div></Col>
  </Row>
</template>
```
