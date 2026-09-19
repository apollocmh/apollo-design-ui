<script setup lang="ts">
import { ref } from 'vue';
import { Space, type SpaceSize } from '../../index';
import { BTN_DASHED, BTN_DEFAULT, BTN_PRIMARY, BTN_TEXT } from './_standin';

type Choice = 'small' | 'medium' | 'large' | 'customize';

const size = ref<Choice>('small');
const customSize = ref(0);

const spaceSize = (): SpaceSize => (size.value === 'customize' ? customSize.value : size.value);
</script>

<template>
  <label>
    size
    <select v-model="size" aria-label="space size">
      <option value="small">small</option>
      <option value="medium">medium</option>
      <option value="large">large</option>
      <option value="customize">customize</option>
    </select>
  </label>
  <br />
  <br />
  <label v-if="size === 'customize'">
    custom size
    <input v-model.number="customSize" type="range" min="0" max="100" aria-label="custom size" />
  </label>
  <Space :size="spaceSize()">
    <button type="button" :style="BTN_PRIMARY">Primary</button>
    <button type="button" :style="BTN_DEFAULT">Default</button>
    <button type="button" :style="BTN_DASHED">Dashed</button>
    <button type="button" :style="BTN_TEXT">Link</button>
  </Space>
</template>
