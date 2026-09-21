---
order: 11
title:
  zh-CN: 栅格配置器
  en-US: Playground
---

栅格配置器（Slider 用原生 input 等价替换，缺口见 README §7）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Col, Row } from '@apollo-design/ui';

const gutterKey = ref(1);
</script>

<template>
  <Row :gutter="16">
    <Col :span="6"><div class="demo">col-6</div></Col>
  </Row>
</template>
```
