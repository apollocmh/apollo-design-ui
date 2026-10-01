---
order: 5
title:
  zh-CN: 带下拉菜单
  en-US: With Dropdown
---

项的 `menu` 会让它带一个下拉菜单（外层是 `.{p}-overlay-link`，并渲染 `dropdownIcon`）。

```vue
<script setup lang="ts">
// 对齐 antd 的 overlay demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';
import { h } from 'vue';

const menuItems = [
  {
    key: '1',
    label: h(
      'a',
      { target: '_blank', rel: 'noopener noreferrer', href: 'http://www.alipay.com/' },
      'General',
    ),
  },
  {
    key: '2',
    label: h(
      'a',
      { target: '_blank', rel: 'noopener noreferrer', href: 'http://www.taobao.com/' },
      'Layout',
    ),
  },
  {
    key: '3',
    label: h(
      'a',
      { target: '_blank', rel: 'noopener noreferrer', href: 'http://www.tmall.com/' },
      'Navigation',
    ),
  },
];

const items: BreadcrumbItemInput[] = [
  { title: 'Ant Design' },
  { title: h('a', { href: '' }, 'Component') },
  { title: h('a', { href: '' }, 'General'), menu: { items: menuItems } },
  { title: 'Button' },
];
</script>

<template>
  <Breadcrumb :items="items" />
</template>
```
