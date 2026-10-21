<script setup lang="ts">
// 对齐 antd 的 component-token demo：通过组件级 CSS 变量覆盖 Slider Token。
import { Slider } from '@apollo-design/ui';

const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' };
</script>

<template>
  <div class="demo-slider-token">
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 480px">
      <Slider :default-value="30" :aria-label-for-handle="'Customized slider'" />
      <Slider
        range
        :default-value="[20, 60]"
        :marks="marks"
        :aria-label-for-handle="['Lower bound', 'Upper bound']"
      />
    </div>
  </div>
</template>

<style>
/* 与 antd component-token 的覆盖项对应：轨道尺寸、把手尺寸与主色。 */
.demo-slider-token .apollo-slider {
  --apollo-slider-control-size: 14px;
  --apollo-slider-rail-size: 6px;
  --apollo-slider-handle-size: 14px;
  --apollo-slider-handle-size-hover: 18px;
  --apollo-slider-rail-bg: #f0f5ff;
  --apollo-slider-rail-hover-bg: #e6f4ff;
  --apollo-slider-track-bg: #722ed1;
  --apollo-slider-track-hover-bg: #9254de;
  --apollo-slider-handle-color: #722ed1;
  --apollo-slider-handle-active-color: #531dab;
  --apollo-slider-dot-border-color: #d3adf7;
  --apollo-slider-dot-active-border-color: #722ed1;
}
</style>
