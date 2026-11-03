<script setup lang="ts">
import {
  ColorPicker,
  type ColorPickerColor,
  Flex,
  Input,
  InputNumber,
  Slider,
  Typography,
  Watermark,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const content = ref('Apollo Design');
const color = ref('rgba(0, 0, 0, 0.15)');
const fontSize = ref(16);
const zIndex = ref(11);
const rotate = ref(-22);
const gapX = ref<number | null>(100);
const gapY = ref<number | null>(100);
const offsetLeft = ref<number | null>(null);
const offsetTop = ref<number | null>(null);
const offset = computed<[number, number] | undefined>(() =>
  offsetLeft.value === null || offsetTop.value === null
    ? undefined
    : [offsetLeft.value, offsetTop.value],
);
function changeColor(value: ColorPickerColor) {
  color.value = value.toRgbString();
}
</script>

<template>
  <Flex gap="middle" wrap>
    <Watermark class="watermark-custom-preview" :content="content" :z-index="zIndex" :rotate="rotate" :gap="[gapX ?? 100, gapY ?? 100]" :offset="offset" :font="{ color, fontSize }">
      <Typography>
        <p>The light-speed iteration of the digital world makes products more complex. However, human consciousness and attention resources are limited.</p>
      </Typography>
      <img draggable="false" style="z-index: 10; width: 100%; max-width: 800px; position: relative" src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*zx7LTI_ECSAAAAAAAAAAAABkARQnAQ" alt="Watermark preview artwork" />
    </Watermark>
    <div class="watermark-custom-controls">
      <label>Content <Input v-model:value="content" aria-label="Watermark content" placeholder="Please enter" /></label>
      <div class="watermark-custom-field"><span>Color</span><ColorPicker :value="color" aria-label="Watermark color" show-text @change="changeColor" /></div>
      <div class="watermark-custom-field"><span>Font size: {{ fontSize }}</span><Slider v-model:value="fontSize" :min="1" :max="100" aria-label-for-handle="Watermark font size" /></div>
      <div class="watermark-custom-field"><span>zIndex: {{ zIndex }}</span><Slider v-model:value="zIndex" :min="0" :max="100" aria-label-for-handle="Watermark zIndex" /></div>
      <div class="watermark-custom-field"><span>Rotate: {{ rotate }}°</span><Slider v-model:value="rotate" :min="-180" :max="180" aria-label-for-handle="Watermark rotation" /></div>
      <label>Horizontal gap <InputNumber v-model:value="gapX" :min="0" aria-label="Watermark horizontal gap" /></label>
      <label>Vertical gap <InputNumber v-model:value="gapY" :min="0" aria-label="Watermark vertical gap" /></label>
      <label>Horizontal offset <InputNumber v-model:value="offsetLeft" aria-label="Watermark horizontal offset" placeholder="Default" /></label>
      <label>Vertical offset <InputNumber v-model:value="offsetTop" aria-label="Watermark vertical offset" placeholder="Default" /></label>
    </div>
  </Flex>
</template>

<style scoped>
.watermark-custom-preview { flex: 1 1 280px; min-width: 0; }
.watermark-custom-controls { display: flex; flex: 1 1 240px; flex-direction: column; gap: 12px; min-width: 0; border: 1px solid var(--apollo-color-border); border-radius: var(--apollo-border-radius); padding: 16px; }
.watermark-custom-controls label, .watermark-custom-field { display: flex; flex-direction: column; gap: 4px; }
.watermark-custom-controls :deep(.apollo-input-number) { width: 100%; }
</style>
