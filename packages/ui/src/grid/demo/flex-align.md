---
order: 5
title:
  zh-CN: 对齐
  en-US: Alignment
---

子元素垂直对齐方式：`align` 取 `top` / `middle` / `bottom` / `stretch`。`stretch` 拉伸列的交叉轴尺寸；列内具有固定高度的内容仍保留自己的高度。

`stretch` explicitly stretches the column box, while fixed-height children keep their own size.

```vue
<script setup lang="ts">
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row align="middle" style="height: 80px">
    <Col :span="4"><div class="demo">col-4</div></Col>
  </Row>
</template>
```
