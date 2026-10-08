const n=`<script setup lang="ts">
// 对齐 antd 的 image demo：条目是图片 —— 图片是**加载后**才有真实高度，
// 所以这条路径依赖根元素上的 \`load\` / \`error\` 监听 + \`ResizeObserver\`。
//
// 🚨 但那条 \`load\` 监听在**上游是死代码**（React 把 \`load\` 当非委托事件直接绑在根 div 上、
//    冒泡阶段，而 \`load\` 不冒泡 ⇒ 子 \`<img>\` 的事件到不了根 div）。
//    本仓**照抄同样的绑定**（见 \`docs/analysis/masonry.md\` §6.1），所以行为一致。
//    需要「图片加载后重排」时请用 \`fresh\`（每个条目各挂观察者）。
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h } from 'vue';

const imageList = [
  'https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f',
  'https://images.unsplash.com/photo-1507513319174-e556268bb244',
  'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2',
  'https://images.unsplash.com/photo-1492778297155-7be4c83960c7',
  'https://images.unsplash.com/photo-1508062878650-88b52897f298',
  'https://images.unsplash.com/photo-1506158278516-d720e72406fc',
];

const items = imageList.map((img, index) => ({ key: \`item-\${index}\`, data: img }));

const renderItem = ({ data }: MasonryItemRenderInfo<unknown>) =>
  h('img', {
    alt: 'sample',
    src: \`\${String(data)}?w=523&auto=format\`,
    style: { width: '100%', display: 'block' },
  });
<\/script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items" :item-render="renderItem" />
</template>
`;export{n as default};
