---
order: 8
title:
  zh-CN: 响应式布局
  en-US: Responsive
---

`xs` … `xxxl` 预设六个响应式尺寸（参照 Bootstrap 的 ≤576 / ≥576 / ≥768 / ≥992 / ≥1200 / ≥1600 / ≥1920），也可传对象配置 span/offset 等。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :xs="2" :md="4" :xl="6" :xxl="8"><div class="demo">Col</div></Col>
  </Row>
</template>
```
