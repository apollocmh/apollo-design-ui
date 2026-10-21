<script setup lang="ts">
// 对齐 antd 的 `dot-duration` demo：autoplay 对象形态开启圆点进度动画。
import type { CarouselAutoplay } from '@apollo-design/ui';
import { Carousel, Switch, Text } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const autoplay = ref(true);
const dotDuration = ref(true);
const current = ref(0);

const autoplayConfig = computed<boolean | CarouselAutoplay>(() =>
  autoplay.value ? { dotDuration: dotDuration.value } : false,
);

const onAfterChange = (index: number) => {
  current.value = index;
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px">
      <Text>autoplay</Text>
      <Switch v-model:checked="autoplay" aria-label="自动播放" />
      <Text>dotDuration</Text>
      <Switch v-model:checked="dotDuration" aria-label="圆点进度动画" />
      <Text type="secondary">current: {{ current }}</Text>
    </div>
    <Carousel :autoplay="autoplayConfig" :autoplay-speed="3000" @after-change="onAfterChange">
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #364d79">1</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #626c91">2</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #1677ff">3</h3></div>
    </Carousel>
  </div>
</template>
