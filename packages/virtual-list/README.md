# @apollo-design/virtual-list

Vue 泛型虚拟列表，使用原生滚动，仅渲染当前可见范围及必要的额外项。支持稳定键、动态高度测量、横向内容与按项滚动。

## 安装

```bash
npm install @apollo-design/virtual-list vue
```

## 基本列表

```vue
<script setup lang="ts">
import { VirtualList } from '@apollo-design/virtual-list';

const rows = Array.from({ length: 1000 }, (_, id) => ({ id, title: `第 ${id + 1} 行` }));
</script>

<template>
  <VirtualList :data="rows" :height="240" :item-height="32" item-key="id">
    <template #default="{ item, style }">
      <div :style="[style, { minHeight: '32px' }]">{{ item.title }}</div>
    </template>
  </VirtualList>
</template>
```

每项默认槽接收 `{ item, index, style, offsetX }`，需要一个可测量的 HTMLElement 根节点。把 `style` 绑定到该根，并使用稳定、唯一的 `itemKey`。

## 尺寸与滚动

`height` 指定视口高度，`itemHeight` 提供行高估计，实际尺寸由测量更新。关闭 `virtual` 或未满足虚拟化条件时使用普通列表路径。`scrollWidth` 为横向内容提供宽度，`direction` 支持 LTR/RTL。

实例暴露 `nativeElement`、`scrollTo` 和 `getScrollInfo`。`scrollTo` 接受坐标，或 `{ index }` / `{ key }` 目标；`align` 支持 `'top'`、`'bottom'`，省略时仅在需要时滚入可见范围。

`scroll` 提供原生滚动事件，`virtualScroll` 提供偏移信息，`visibleChange` 提供当前可见项。需要独立范围计算时可使用 `computeRange`、`computeScrollTarget` 与 `createCacheMap`。

行内容、可访问语义、选中状态与主题由宿主提供。本包不使用自绘滚动条，也不替代 Table 或 Tree 的业务行为。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/virtual-list/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
