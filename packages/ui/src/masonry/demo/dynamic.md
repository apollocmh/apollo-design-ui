---
order: 2
title:
  zh-CN: 动态
  en-US: Dynamic
---

增删条目；`onLayoutChange` 把算出来的列号写回 `items`，写回后条目就「钉」在该列。

⚠️ 与 antd 的 demo 有两处**有意**差异：① 新增条目的高度用确定值
（上游用 `Math.random()`，每次渲染都不同 ⇒ demo 冒烟测试不可复现）；
② `Card` / `CloseOutlined` 用原生 div / 文本 `×` 替换（本仓 Card 尚未落地）。

```vue
<script setup lang="ts">
import {
  Button,
  Masonry,
  type MasonryItemRenderInfo,
  type MasonryLayoutItem,
} from '@apollo-design/ui';
import { h, ref } from 'vue';

const heights = [150, 50, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 70, 50, 80];

interface Item {
  key: number;
  column?: number;
  data: number;
}

const items = ref<Item[]>(
  heights.map((height, index) => ({ key: index, column: index % 4, data: height })),
);

const removeItem = (removeKey: number): void => {
  items.value = items.value.filter(({ key }) => key !== removeKey);
};

const addItem = (): void => {
  const last = items.value[items.value.length - 1];
  items.value = [
    ...items.value,
    { key: last ? last.key + 1 : 0, data: 50 + ((items.value.length * 17) % 100) },
  ];
};

const onLayoutChange = (sortedItems: MasonryLayoutItem<unknown>[]): void => {
  items.value = items.value.map((item) => {
    const match = sortedItems.find((sorted) => sorted.key === item.key);
    return match ? { ...item, column: match.column } : item;
  });
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Masonry
      :columns="4"
      :gutter="16"
      :items="items"
      :item-render="renderItem"
      :on-layout-change="onLayoutChange"
    />
    <Button block @click="addItem">Add Item</Button>
  </div>
</template>
```
