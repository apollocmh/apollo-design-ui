<script setup lang="ts">
// 对齐 antd demo/coverPlacement.tsx
import { Image } from '@apollo-design/ui';
import { h } from 'vue';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const placements = ['center', 'top', 'bottom'] as const;
const coverNode = (text: string) => h('span', text);
void coverNode;
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Image alt="demo image"
      v-for="p in placements"
      :key="p"
      :width="96"
      :src="src"
      :preview="{ cover: { placement: p, coverNode: p } }"
    />
  </div>
</template>
