<script setup lang="ts">
import { h, type VNodeChild } from 'vue';
import { MotionList } from '../../motion-list';

const rows: {
  key: number;
  title: string;
  position: { column: number; top: number };
  content: VNodeChild;
}[] = [
  {
    key: 0,
    title: 'Retained title',
    position: { column: 1, top: 80 },
    content: h('b', 'Rich content'),
  },
];
</script>

<template>
  <MotionList :keys="rows" :component="null" :support-motion="false">
    <template #default="scope">
      <article :data-column="scope.position.column" :data-top="scope.position.top">{{ scope.title.toUpperCase() }}</article>
      <!-- @vue-expect-error title is a string; a leaked any slot would invalidate this negative case -->
      <span :data-invalid="scope.title.toFixed(2)">Invalid title</span>
    </template>
  </MotionList>
</template>
