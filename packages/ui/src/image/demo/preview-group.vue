<script setup lang="ts">
// 对齐 antd demo/preview-group.tsx
import { Image } from '@apollo-design/ui';
import { h } from 'vue';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PreviewGroup = Image.PreviewGroup;
void h;
</script>

<template>
  <PreviewGroup>
    <Image alt="demo image" v-for="i in 3" :key="i" :width="200" :src="src" />
  </PreviewGroup>
</template>
