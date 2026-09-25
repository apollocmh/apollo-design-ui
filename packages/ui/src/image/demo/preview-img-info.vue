<script setup lang="ts">
// 对齐 antd demo/preview-imgInfo.tsx
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
</script>

<template>
  <Image alt="demo image" :width="200" :height="120" :src="src" :preview="{ src }" />
</template>
