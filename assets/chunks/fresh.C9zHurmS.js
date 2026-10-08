const n=`<script setup lang="ts">
// 对齐 antd 的 fresh demo：条目内容的高度会变 ⇒ 需要 \`fresh\`（每个条目各挂一个
// ResizeObserver）。不加 \`fresh\` 时只有「条目数 / 列数变化」才会重新量测。
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h, ref } from 'vue';

const heights = [150, 50, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 60, 50, 80];

const items = heights.map((height, index) => ({ key: \`item-\${index}\`, data: height }));
const current = ref<number[]>([...heights]);

/** ⚠️ antd 的 demo 用 \`Math.random()\` —— 这里用**确定值**（每次点：换到下一档）。 */
const bump = (index: number): void => {
  current.value = current.value.map((height, i) => (i === index ? (height % 180) + 20 : height));
};

const renderItem = ({ index }: MasonryItemRenderInfo<unknown>) =>
  h(
    'div',
    {
      style: {
        height: \`\${current.value[index]}px\`,
        padding: '8px',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'height 0.3s',
      },
      onClick: () => bump(index),
    },
    \`\${index + 1} - Click\`,
  );
<\/script>

<template>
  <Masonry fresh :columns="4" :gutter="16" :items="items" :item-render="renderItem" />
</template>
`;export{n as default};
