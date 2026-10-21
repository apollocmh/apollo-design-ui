<script setup lang="ts">
// 对齐 antd 的 `back-top` demo：指定滚动容器并展示进度环。
import { FloatButtonBackTop, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

const getTarget = () => scrollContainer.value ?? window;

const onScroll = (event: Event) => {
  scrollTop.value = Math.round((event.currentTarget as HTMLElement).scrollTop);
};
</script>

<template>
  <div>
    <Text type="secondary">在下方容器内滚动，超过 80px 后显示带进度环的回到顶部按钮。</Text>
    <div
      ref="scrollContainer"
      style="height: 240px; overflow-y: auto; margin-top: 12px; padding: 12px; border: 1px solid #f0f0f0; border-radius: 8px"
      @scroll="onScroll"
    >
      <div v-for="i in 40" :key="i" style="padding: 6px 0">Scroll content {{ i }}</div>
    </div>
    <div style="margin-top: 8px"><Text type="secondary">scrollTop: {{ scrollTop }}px</Text></div>
    <FloatButtonBackTop
      :target="getTarget"
      :visibility-height="80"
      :duration="300"
      show-progress
    />
  </div>
</template>
