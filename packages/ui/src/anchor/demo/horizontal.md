## zh-CN

横向 Anchor。

```vue
<script setup lang="ts">
// 对齐 antd 的 horizontal demo：`direction="horizontal"` ⇒ ink 变成底部横条。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];
</script>

<template>
  <Anchor direction="horizontal" :items="items" :affix="false" />
</template>
```

## en-US

Horizontally aligned anchors.

```vue
<script setup lang="ts">
// 对齐 antd 的 horizontal demo：`direction="horizontal"` ⇒ ink 变成底部横条。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];
</script>

<template>
  <Anchor direction="horizontal" :items="items" :affix="false" />
</template>
```
