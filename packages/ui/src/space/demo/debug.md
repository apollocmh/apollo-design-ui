---
order: 11
title:
  zh-CN: 假值子节点
  en-US: Debug
---

数字 `0` 是内容；null、false、undefined 不产生内容包装。

Zero is content; null, false and undefined do not create content wrappers.

```vue
<script setup lang="ts">
import { h, type VNodeChild } from 'vue';
import { Button, Space } from '@apollo-design/ui';
const items: VNodeChild[] = ['Button', h(Button, null, () => 'Button'), 'Button', h(Button, null, () => 'Delete'), h(Button, { disabled: true }, () => 'Delete'), null, false, 0, 'Button', null, undefined];
const Demo = () => h(Space, null, { default: () => items });
</script>
<template><component :is="Demo" /></template>
```
