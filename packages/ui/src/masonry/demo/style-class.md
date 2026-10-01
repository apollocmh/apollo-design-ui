---
order: 5
title:
  zh-CN: 自定义样式
  en-US: Custom Style
---

`classNames` / `styles` 两个语义槽都支持**对象**与**函数**两种形态；
函数形态的入参 `props.columns` 是**解析后的列数**（不是原始 prop）。

⚠️ 与 antd 的 demo 的差异：上游用 `antd-style` 的 `createStaticStyles` 生成类名，
本仓没有这个依赖 ⇒ 用普通类名替换；`Flex` / `Divider` / `Typography` 换成原生元素。
**缺口登记在 `README.md` §7。**

```vue
<script setup lang="ts">
import { Masonry, type MasonryItemRenderInfo, type MasonryProps } from '@apollo-design/ui';
import { h } from 'vue';

const heights = [120, 80, 100, 60, 140, 90, 110, 70];
const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const renderItem = ({ data, index }: MasonryItemRenderInfo<unknown>) =>
  h('div', { style: { height: `${Number(data)}px` } }, String(index + 1));

const styles: MasonryProps['styles'] = {
  root: { borderRadius: 12, padding: 20, height: 260, backgroundColor: 'rgba(250,250,250,0.5)' },
  item: { border: '1px solid #ccc', borderRadius: 12, overflow: 'hidden' },
};

/** 函数形态：按解析后的 `columns` 分支。 */
const stylesFn: MasonryProps['styles'] = ({ props }) => ({
  root: {
    border: `2px solid ${typeof props.columns === 'number' && props.columns > 2 ? '#1890ff' : '#52c41a'}`,
    padding: 20,
    height: 280,
  },
});
</script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items" :item-render="renderItem" :styles="stylesFn" />
</template>
```
