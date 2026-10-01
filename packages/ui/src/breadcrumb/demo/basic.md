---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

最简单的用法。`title` 可以是字符串，也可以是一个 vnode（链接、图标…）；
最后一项目标没有 `href` ⇒ 渲染成 `<span>`（不可点）。

```vue
<script setup lang="ts">
// 对齐 antd 的 basic demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';
import { h } from 'vue';

const items: BreadcrumbItemInput[] = [
  { title: 'Home' },
  { title: h('a', { href: '' }, 'Application Center') },
  { title: h('a', { href: '' }, 'Application List') },
  { title: 'An Application' },
];
</script>

<template>
  <Breadcrumb :items="items" />
</template>
```
