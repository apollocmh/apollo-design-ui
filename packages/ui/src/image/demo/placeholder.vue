<script setup lang="ts">
// 对齐 antd demo/placeholder.tsx —— 进度占位（percent 由使用方推进）
import { Image } from '@apollo-design/ui';
import { onMounted, onUnmounted, ref } from 'vue';

const percent = ref(-1);
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  const tick = () => {
    percent.value = Math.min(percent.value + 8, 100);
    if (percent.value < 100) timer = setTimeout(tick, 200);
  };
  timer = setTimeout(tick, 200);
});
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <Image alt="demo image"
    :width="200"
    :height="200"
    :placeholder="{ progress: { percent: percent === -1 ? undefined : percent } }"
  />
</template>
