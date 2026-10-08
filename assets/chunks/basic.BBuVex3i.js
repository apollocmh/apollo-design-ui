const n=`<script setup lang="ts">
// 对齐 antd 的 basic demo。⚠️ antd 用 \`Card\` 渲染条目 —— 本仓 Card 尚未落地，
// 用**原生 div + 等价内联样式**替换（缺口登记在 README §7）。
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h } from 'vue';

const heights = [150, 50, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 60, 50, 80];

const items = heights.map((height, index) => ({ key: \`item-\${index}\`, data: height }));

const renderItem = ({ data, index }: MasonryItemRenderInfo<unknown>) =>
  h(
    'div',
    {
      style: {
        height: \`\${Number(data)}px\`,
        padding: '8px',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxSizing: 'border-box',
      },
    },
    String(index + 1),
  );
<\/script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items" :item-render="renderItem" />
</template>
`;export{n as default};
