<script setup lang="ts">
// 对齐 antd 的 custom demo（PLATFORM 替换：antd 用 Form + Input + InputNumber +
// Slider + ColorPicker 搭配置面板，这些组件在本仓尚未落地 ⇒ 用原生控件等价实现，
// 受控数据流与 watermarkProps 逐字一致。落地后换回组件版。）
import { Flex, Typography, Watermark } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const content = ref('Ant Design');
const color = ref('rgba(0, 0, 0, 0.15)');
const fontSize = ref(16);
const zIndex = ref(11);
const rotate = ref(-22);
const gapX = ref(100);
const gapY = ref(100);
const offsetLeft = ref<number | undefined>(undefined);
const offsetTop = ref<number | undefined>(undefined);

const offset = computed<[number, number] | undefined>(() =>
  offsetLeft.value === undefined || offsetTop.value === undefined
    ? undefined
    : [offsetLeft.value, offsetTop.value],
);
</script>

<template>
  <Flex gap="middle">
    <Watermark
      :content="content"
      :z-index="zIndex"
      :rotate="rotate"
      :gap="[gapX, gapY]"
      :offset="offset"
      :font="{ color, fontSize }"
    >
      <Typography>
        <p>
          The light-speed iteration of the digital world makes products more complex. However, human
          consciousness and attention resources are limited.
        </p>
      </Typography>
      <img
        draggable="false"
        style="z-index: 10; width: 100%; max-width: 800px; position: relative"
        src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*zx7LTI_ECSAAAAAAAAAAAABkARQnAQ"
        alt="img"
      />
    </Watermark>
    <div style="width: 280px; flex-shrink: 0; border-inline-start: 1px solid #eee; padding-inline-start: 16px">
      <label>Content <input v-model="content" placeholder="Please enter" /></label>
      <label>Color <input v-model="color" type="color" /></label>
      <label>FontSize <input v-model.number="fontSize" type="range" min="1" max="100" step="1" /></label>
      <label>zIndex <input v-model.number="zIndex" type="range" min="0" max="100" step="1" /></label>
      <label>Rotate <input v-model.number="rotate" type="range" min="-180" max="180" step="1" /></label>
      <label>gapX <input v-model.number="gapX" type="number" /></label>
      <label>gapY <input v-model.number="gapY" type="number" /></label>
      <label>offsetLeft <input v-model.number="offsetLeft" type="number" /></label>
      <label>offsetTop <input v-model.number="offsetTop" type="number" /></label>
    </div>
  </Flex>
</template>

<style scoped>
label {
  display: block;
  margin-block-end: 8px;
}
input {
  width: 100%;
}
</style>
