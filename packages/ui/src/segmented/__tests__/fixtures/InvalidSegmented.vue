<script setup lang="ts">
import { Segmented } from '../../index';

const wrongChange = (_value: boolean) => {};
const wrongKeydown = (_value: string) => {};
</script>
<template>
  <!-- @vue-expect-error change proposes the actual scalar option value -->
  <Segmented :options="['A', 'B']" @change="wrongChange" />
  <!-- @vue-expect-error keydown delivers the actual native KeyboardEvent -->
  <Segmented :options="['A', 'B']" @keydown="wrongKeydown" />
  <!-- @vue-expect-error semantic styles consume CSSProperties -->
  <Segmented :options="['A', 'B']" :styles="{ label: { textAlign: 123 } }" />
</template>
