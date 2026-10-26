<script setup lang="ts">
import { Image } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const current = ref(0);
const openChanges = ref(0);
const lastOpenChange = ref('none');
const currentChanges = ref(0);
const lastCurrentChange = ref('none');
const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PreviewGroup = Image.PreviewGroup;
const items = [src, src, src].map((source, index) => ({
  src: source,
  alt: `Controlled group image ${index + 1}`,
}));

function onOpenChange(next: boolean, prev: boolean) {
  openChanges.value++;
  lastOpenChange.value = `${prev} → ${next}`;
}

function onChange(next: number, prev: number) {
  currentChanges.value++;
  lastCurrentChange.value = `${prev} → ${next}`;
}
</script>

<template>
  <section data-image-group-model-demo style="display: flex; flex-direction: column; row-gap: 8px; align-items: flex-start">
    <button type="button" aria-haspopup="dialog" :aria-expanded="open" @mousedown.prevent @click="open = !open">
      {{ open ? 'Close controlled group preview' : 'Open controlled group preview' }}
    </button>
    <button type="button" @mousedown.prevent @click="current = (current + 1) % items.length">Next image from parent</button>
    <PreviewGroup
      v-model:open="open"
      v-model:current="current"
      :items="items"
      @open-change="onOpenChange"
      @change="onChange"
    />
    <p>Parent open model: <output data-image-group-open>{{ open }}</output>; current index: <output data-image-group-current>{{ current }}</output>.</p>
    <p>Component open changes: <output data-image-group-open-changes>{{ openChanges }}</output>; previous → next: <output data-image-group-open-transition>{{ lastOpenChange }}</output>.</p>
    <p>Component image changes: <output data-image-group-current-changes>{{ currentChanges }}</output>; previous → next: <output data-image-group-current-transition>{{ lastCurrentChange }}</output>.</p>
  </section>
</template>
