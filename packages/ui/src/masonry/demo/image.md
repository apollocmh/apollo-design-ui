---
order: 4
title:
  zh-CN: 图片
  en-US: Image
---

条目是图片。图片**加载后**才有真实高度 ⇒ 需要重新量测。

⚠️ 上游把 `onLoad` / `onError` 挂在根 `div` 上，但那条路径**实际是死代码**
（React 把 `load` 当非委托事件直接绑在该元素、冒泡阶段，而 `load` 不冒泡 ⇒
子 `<img>` 的事件到不了根 `div`）。本仓**照抄同样的绑定**，行为与 antd 一致。
需要「内容尺寸变化就重排」时请用 `fresh`。

```vue
<script setup lang="ts">
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h } from 'vue';

const imageList = [
  'https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f',
  'https://images.unsplash.com/photo-1507513319174-e556268bb244',
  'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2',
  'https://images.unsplash.com/photo-1492778297155-7be4c83960c7',
];

const items = imageList.map((img, index) => ({ key: `item-${index}`, data: img }));

const renderItem = ({ data }: MasonryItemRenderInfo<unknown>) =>
  h('img', { alt: 'sample', src: `${String(data)}?w=523&auto=format`, style: { width: '100%' } });
</script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items" :item-render="renderItem" />
</template>
```
