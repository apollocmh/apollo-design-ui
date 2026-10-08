const n=`<script setup lang="ts">
// 对齐 antd 的 draggable demo（@dnd-kit 未落地 —— HTML5 原生 draggable 等价替换）

import { Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const items = ref([
  { id: 1, text: 'Tag 1' },
  { id: 2, text: 'Tag 2' },
  { id: 3, text: 'Tag 3' },
]);

const dragIndex = ref(-1);

const onDragStart = (i: number) => {
  dragIndex.value = i;
};
const onDrop = (i: number) => {
  if (dragIndex.value < 0 || dragIndex.value === i) return;
  const next = [...items.value];
  const moved = next.splice(dragIndex.value, 1)[0];
  if (!moved) return;
  next.splice(i, 0, moved);
  items.value = next;
  dragIndex.value = -1;
};
<\/script>

<template>
  <Tag
    v-for="(item, i) in items"
    :key="item.id"
    draggable="true"
    :style="{ cursor: 'move' }"
    @dragstart="onDragStart(i)"
    @dragover.prevent
    @drop="onDrop(i)"
  >
    {{ item.text }}
  </Tag>
</template>
`;export{n as default};
