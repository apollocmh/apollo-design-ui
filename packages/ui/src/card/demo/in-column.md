---
order: 4
title:
  zh-CN: 栅格卡片
  en-US: Card in column
---

在系统概览页面常常和栅格进行配合。

```vue
<script setup lang="ts">
// 对齐 antd 的 in-column demo。
import { Card, Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="16">
    <Col :span="8">
      <Card title="Card title" variant="borderless">Card content</Card>
    </Col>
    <Col :span="8">
      <Card title="Card title" variant="borderless">Card content</Card>
    </Col>
    <Col :span="8">
      <Card title="Card title" variant="borderless">Card content</Card>
    </Col>
  </Row>
</template>
```
