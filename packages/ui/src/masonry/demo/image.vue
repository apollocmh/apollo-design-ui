<script setup lang="ts">
// Native image load events trigger a new layout; local SVG sources keep the preview available offline.
import { Masonry } from '@apollo-design/ui';

const sizes = [260, 420, 320, 480, 360, 280];
const colors = ['#91caff', '#b7eb8f', '#ffd591', '#d3adf7', '#87e8de', '#ffadd2'];
const items = sizes.map((height, index) => ({
  key: `image-${index}`,
  data: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${height}" viewBox="0 0 640 ${height}"><rect width="640" height="${height}" fill="${colors[index]}"/><circle cx="480" cy="80" r="36" fill="#fff" opacity=".8"/><path d="M0 ${height}V${height * 0.7}L180 ${height * 0.3}L360 ${height * 0.8}L480 ${height * 0.5}L640 ${height * 0.85}V${height}Z" fill="#16304b" opacity=".65"/></svg>`)}`,
}));
</script>

<template>
  <Masonry :columns="{ xs: 2, sm: 3, lg: 4 }" :gutter="16" :items="items">
    <template #item="{ data, index }">
      <img :alt="`Landscape illustration ${index + 1}`" :src="data" style="width: 100%; display: block; border-radius: var(--apollo-border-radius)" />
    </template>
  </Masonry>
</template>
