---
order: 0
title:
  zh-CN: 基础栅格
  en-US: Basic
---

从堆叠到水平排列。使用单一的一组 `Row` 和 `Col` 栅格组件，就可以创建一个基本的栅格系统，所有列（Col）必须放在 `Row` 内。

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="24"><div class="demo">col-24</div></Col>
  </Row>
</template>
```
