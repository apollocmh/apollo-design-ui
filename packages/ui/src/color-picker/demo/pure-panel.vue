<script setup lang="ts">
import type { ColorValueType } from '@apollo-design/ui';
import { ColorPickerPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const color = ref<ColorValueType>('#1677ff');
</script>

<template>
  <div :style="{ paddingInlineStart: '100px' }">
    <ColorPickerPurePanel :color-picker-props="{ value: color }" @change="value => color = value" />
  </div>
</template>
