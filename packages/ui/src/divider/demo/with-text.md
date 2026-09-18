---
order: 1
title:
  zh-CN: 带文字的分割线
  en-US: With Text
---

`titlePlacement` 控制标题位置：`start` / `center`（默认）/ `end`。

标题与最近那条边框的距离由 `styles.content.margin` 控制 —— 这是替代已废弃的
`orientationMargin` 的写法（`orientationMargin` 仍可用，但会输出 deprecated 告警）。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider>Text</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="start">Left Text</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="end">Right Text</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="start" :styles="{ content: { margin: 0 } }">
    Left Text margin with 0
  </Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider title-placement="end" :styles="{ content: { margin: '0 50px' } }">
    Right Text margin with 50px
  </Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
</template>
```
