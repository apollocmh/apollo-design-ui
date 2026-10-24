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
// 对齐 antd 的 dynamic demo：增删条目 + 用 `onLayoutChange` 把算出来的列号写回 items
// （写回之后条目就「钉」在该列，后续不再被自动重排）。
import {
  Button,
  Masonry,
  type MasonryLayoutItem,
} from '@apollo-design/ui';
import { ref } from 'vue';

const tileStyle = {
  padding: '8px',
  background: '#fff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  boxSizing: 'border-box',
} as const;

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
    // ⚠️ antd 的 demo 用 `Math.random()` 取高度 —— 那会让每次渲染不同。
    // 这里用**确定值**（按当前长度推导）以便 demo 冒烟测试可复现。
    { key: last ? last.key + 1 : 0, data: 50 + ((items.value.length * 17) % 100) },
  ];
};

const onLayoutChange = (sortedItems: MasonryLayoutItem<number>[]): void => {
  items.value = items.value.map((item) => {
    const match = sortedItems.find((sorted) => sorted.key === item.key);
    return match ? { ...item, column: match.column } : item;
  });
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Masonry :columns="4" :gutter="16" :items="items" @layout-change="onLayoutChange">
      <template #item="{ data, key }">
        <div :style="{ ...tileStyle, height: `${data}px`, position: 'relative' }">
          {{ Number(key) + 1 }}
          <Button
            size="small"
            style="position: absolute; top: 8px; right: 8px"
            @click="removeItem(Number(key))"
          >×</Button>
        </div>
      </template>
    </Masonry>
    <Button block @click="addItem">Add Item</Button>
  </div>
</template>

```
