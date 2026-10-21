<script setup lang="ts">
// 对齐 antd 的 component-token demo：用 CSS 变量覆盖 Statistic 的字号 Token。
import { Slider, Statistic, Text } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const contentFontSize = ref(36);
const tokenStyle = computed(() => ({
  '--apollo-statistic-title-font-size': '16px',
  '--apollo-statistic-content-font-size': `${contentFontSize.value}px`,
}));
</script>

<template>
  <div>
    <Statistic title="Active Users" :value="112893" :style="tokenStyle" />
    <div style="max-width: 320px; margin-top: 24px">
      <Text type="secondary">数值字号：{{ contentFontSize }}px</Text>
      <Slider
        v-model:value="contentFontSize"
        :min="20"
        :max="64"
        :aria-label-for-handle="'Statistic content font size'"
      />
    </div>
  </div>
</template>
