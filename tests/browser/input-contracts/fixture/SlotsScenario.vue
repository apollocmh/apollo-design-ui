<script setup>
import { Input } from '@input-source/input/index.ts';

defineProps({ enabled: Boolean, label: String, counter: Number });
</script>
<template>
  <Input aria-label="SFC slot editor" prefix="prop-prefix" suffix="prop-suffix" default-value="slot draft">
    <template v-if="enabled" #prefix><strong data-slot="prefix">{{ label }} {{ counter }}</strong></template>
    <template #suffix></template>
  </Input>
</template>
