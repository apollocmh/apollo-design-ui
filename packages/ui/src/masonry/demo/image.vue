<script setup lang="ts">
// 图片的非冒泡 load/error 由根捕获，加载后自动重新测量。
import { Masonry } from '@apollo-design/ui';

const imageList = [
  'https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f',
  'https://images.unsplash.com/photo-1507513319174-e556268bb244',
  'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2',
  'https://images.unsplash.com/photo-1492778297155-7be4c83960c7',
  'https://images.unsplash.com/photo-1508062878650-88b52897f298',
  'https://images.unsplash.com/photo-1506158278516-d720e72406fc',
];

const items = imageList.map((img, index) => ({ key: `item-${index}`, data: img }));
</script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items">
    <template #item="{ data }">
      <img alt="sample" :src="`${data}?w=523&auto=format`" style="width: 100%; display: block" />
    </template>
  </Masonry>
</template>
