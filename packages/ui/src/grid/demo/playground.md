---
order: 11
title:
  zh-CN: 栅格配置器
  en-US: Playground
---

使用三个原生范围控件配置水平间距、纵向间距和列数。水平间距包含 `0` / `10.5px`，纵向包含 `0` / `7.5px`；可用方向键、Home、End 调整。

Native ranges demonstrate independent axes, zero/fractional gutters and keyboard input.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Col, Row } from '@apollo-design/ui';

const horizontal = ref(10.5);
const vertical = ref(7.5);
</script>

<template>
  <Row :gutter="[horizontal, vertical]">
    <Col :span="6"><div class="demo">col-6</div></Col>
  </Row>
</template>
```
