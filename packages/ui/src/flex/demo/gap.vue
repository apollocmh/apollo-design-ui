<script setup lang="ts">
// 对齐 antd 的 gap demo（Radio.Group / Slider 用原生 radio / input 等价替换，缺口见 README §7）

import type { FlexProps } from '@apollo-design/ui';
import { Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const gapSize = ref<FlexProps['gap']>('small');
const customGapSize = ref(0);
</script>

<template>
  <Flex gap="medium" vertical>
    <label style="display: flex; gap: 12px">
      <template v-for="size in ['small', 'medium', 'large', 'customize']" :key="size">
        <input v-model="gapSize" type="radio" :value="size" /> {{ size }}
      </template>
    </label>
    <input v-if="gapSize === 'customize'" v-model.number="customGapSize" type="range" min="0" max="64" />
    <Flex :gap="gapSize !== 'customize' ? gapSize : customGapSize">
      <button type="button">Primary</button>
      <button type="button">Default</button>
      <button type="button">Dashed</button>
      <button type="button">Link</button>
    </Flex>
  </Flex>
</template>
