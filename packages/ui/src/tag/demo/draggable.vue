<script setup lang="ts">
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
  const from = dragIndex.value;
  dragIndex.value = -1;
  if (from < 0 || from === i) return;
  const next = [...items.value];
  const moved = next.splice(from, 1)[0];
  if (!moved) return;
  next.splice(i, 0, moved);
  items.value = next;
  dragIndex.value = -1;
};
</script>

<template>
  <Tag
    v-for="(item, i) in items"
    :key="item.id"
    draggable="true"
    :style="{ cursor: 'move' }"
    @dragstart="onDragStart(i)"
    @dragend="dragIndex = -1"
    @dragover.prevent
    @drop="onDrop(i)"
  >
    {{ item.text }}
  </Tag>
</template>
