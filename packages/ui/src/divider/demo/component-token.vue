<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Checkbox, ConfigProvider, Divider, Slider } from '../../index';

const enabled = ref(true);
const padding = ref(12);
const ratio = ref(0.2);
const margin = ref(16);
const theme = computed(() =>
  enabled.value
    ? {
        components: {
          Divider: {
            textPaddingInline: padding.value,
            orientationMargin: ratio.value,
            verticalMarginInline: margin.value,
          },
        },
      }
    : {},
);
function reset() {
  padding.value = 16;
  ratio.value = 0.05;
  margin.value = 8;
  enabled.value = false;
}
</script>

<template>
  <div class="divider-token-controls">
    <Checkbox v-model:checked="enabled">Enable component theme</Checkbox>
    <div>Text padding: {{ padding }}px<Slider v-model:value="padding" aria-label="Divider text padding" :min="0" :max="40" :step="2" /></div>
    <div>Edge ratio: {{ ratio }}<Slider v-model:value="ratio" aria-label="Divider edge ratio" :min="0" :max="1" :step="0.05" /></div>
    <div>Vertical margin: {{ margin }}px<Slider v-model:value="margin" aria-label="Divider vertical margin" :min="0" :max="32" :step="2" /></div>
    <Button style="width: fit-content" @click="reset">Reset Divider theme</Button>
  </div>
  <ConfigProvider :theme="theme">
    <Divider title-placement="start">Section heading</Divider>
    <div class="divider-token-inline"><span>First column</span><Divider orientation="vertical" /><span>Second column</span></div>
  </ConfigProvider>
</template>

<style scoped>
.divider-token-controls { display: grid; gap: 12px; }
.divider-token-inline { margin-block: 16px; }
</style>
