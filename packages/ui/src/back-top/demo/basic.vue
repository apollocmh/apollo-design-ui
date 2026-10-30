<script setup lang="ts">
import { BackTop } from '@apollo-design/ui';
import { ref } from 'vue';

const scrollTarget = ref<HTMLElement | null>(null);
const clicks = ref(0);
const getTarget = () => scrollTarget.value;

const lines = Array.from(
  { length: 20 },
  (_, index) => `第 ${index + 1} 行内容，向下滚动查看右下角按钮。`,
);
</script>

<template>
  <div style="position: relative">
    <div ref="scrollTarget" class="demo-back-top-content" style="height: 180px; overflow: auto" tabindex="0" aria-label="滚动内容">
      <p v-for="line in lines" :key="line">{{ line }}</p>
    </div>
    <BackTop
      :target="getTarget"
      :visibility-height="100"
      aria-label="返回顶部"
      style="position: absolute; inset-inline-end: 16px; inset-block-end: 16px"
      @click="clicks += 1"
    />
  </div>
  <p aria-live="polite">已返回顶部 {{ clicks }} 次。向下滚动内容区域以显示按钮。</p>
</template>
