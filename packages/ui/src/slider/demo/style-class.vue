<script setup lang="ts">
// 对齐 antd 的 style-class demo：根节点用原生 class，内部槽位用 classNames / styles。
import { Slider } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(40);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px">
    <Slider
      class="demo-slider-style-root"
      :class-names="{
        rail: 'demo-slider-style-rail',
        track: 'demo-slider-style-track',
        handle: 'demo-slider-style-handle',
      }"
      :styles="{ track: { backgroundImage: 'linear-gradient(90deg, #1677ff 0%, #52c41a 100%)' } }"
      v-model:value="value"
      :aria-label-for-handle="'Styled slider'"
    />
    <div>当前值：{{ value }}</div>
  </div>
</template>

<style>
.demo-slider-style-root .demo-slider-style-rail {
  background: #fffbe6;
  border: 1px dashed #faad14;
}

.demo-slider-style-root .demo-slider-style-track {
  border-radius: 999px;
}

.demo-slider-style-root .demo-slider-style-handle::after {
  box-shadow: 0 0 0 3px #52c41a;
}
</style>
