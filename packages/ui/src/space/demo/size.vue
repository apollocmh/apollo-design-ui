<script setup lang="ts">
import { Button, Select, Slider, Space, type SpaceSize } from '@apollo-design/ui';
import { ref } from 'vue';

type Choice = 'small' | 'medium' | 'large' | 'customize';
const size = ref<Choice>('small');
const customSize = ref(0);
const spaceSize = (): SpaceSize => (size.value === 'customize' ? customSize.value : size.value);
</script>
<template>
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px">Spacing <Select v-model:value="size" aria-label="Space size" style="width: 140px" :options="['small', 'medium', 'large', 'customize'].map(value => ({ value, label: value }))" /></div>
  <div v-if="size === 'customize'" style="margin-top: 12px">Custom gap: {{ customSize }}px <Slider v-model:value="customSize" :min="0" :max="100" aria-label="Custom size" /></div>
  <div style="margin-top: 16px"><Space :size="spaceSize()" wrap><Button type="primary">Primary</Button><Button>Default</Button><Button type="dashed">Dashed</Button><Button type="text">Text</Button></Space></div>
</template>
