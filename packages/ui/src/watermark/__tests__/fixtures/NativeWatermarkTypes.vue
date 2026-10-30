<script setup lang="ts">
import { ref } from 'vue';
import { Watermark } from '../../index';
import type { WatermarkRef } from '../../interface';

const instance = ref<WatermarkRef | null>(null);
const removed = ref(0);
const clicked = (_event: MouseEvent) => {};
</script>

<template>
  <Watermark ref="instance" :content="['First', { text: 'Second', font: { fontSize: '2rem' } }]" @remove="removed++" @click="clicked">
    <input aria-label="Native default slot" />
    {{ removed }}
  </Watermark>
  <button type="button" @click="instance?.nativeElement?.focus()">Focus root</button>
  <!-- @vue-expect-error remove has no event payload -->
  <Watermark @remove="(_event: MouseEvent) => {}" />
  <!-- @vue-expect-error the default slot has no scoped data -->
  <Watermark v-slot="{ record }"><span :title="record" /></Watermark>
</template>
