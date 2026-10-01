## zh-CN

替换浏览器历史记录中的路径，后退按钮将返回到上一页而不是上一个锚点。

```vue
<script setup lang="ts">
// 对齐 antd 的 replace demo：用 `replaceState` 而不是 `pushState`。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
];
</script>

<template>
  <Anchor replace :items="items" :affix="false" />
</template>
```

## en-US

Replace path in browser history, so back button returns to previous page instead of previous anchor item.

```vue
<script setup lang="ts">
// 对齐 antd 的 replace demo：用 `replaceState` 而不是 `pushState`。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
];
</script>

<template>
  <Anchor replace :items="items" :affix="false" />
</template>
```
