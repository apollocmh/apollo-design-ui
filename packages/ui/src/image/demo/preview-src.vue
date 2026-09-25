<script setup lang="ts">
// 对齐 antd demo/previewSrc.tsx
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
</script>

<template>
  <Image alt="demo image" :width="200" :src="src" :preview="{ src }" />
</template>
