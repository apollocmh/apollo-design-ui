<script setup lang="ts">
import { Image } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const openChanges = ref(0);
const lastOpenChange = ref('none');
const showInitiallyOpen = ref(false);
const defaultOpenChanges = ref(0);
const lastDefaultOpenChange = ref('none');
const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function onOpenChange(next: boolean, prev: boolean) {
  openChanges.value++;
  lastOpenChange.value = `${prev} → ${next}`;
}

function onDefaultOpenChange(next: boolean, prev: boolean) {
  defaultOpenChanges.value++;
  lastDefaultOpenChange.value = `${prev} → ${next}`;
}
</script>

<template>
  <section data-image-controlled-demo style="display: flex; flex-direction: column; row-gap: 8px; align-items: flex-start">
    <button type="button" aria-haspopup="dialog" :aria-expanded="open" @mousedown.prevent @click="open = !open">
      {{ open ? 'Close controlled image preview' : 'Open controlled image preview' }}
    </button>
    <Image v-model:open="open" alt="Controlled preview image"
      :width="200"
      :src="src"
      @open-change="onOpenChange"
    />
    <p>Parent open model: <output data-image-controlled-open>{{ open }}</output>; component open changes: <output data-image-controlled-open-changes>{{ openChanges }}</output>; previous → next: <output data-image-controlled-open-transition>{{ lastOpenChange }}</output>.</p>
    <button type="button" :aria-pressed="showInitiallyOpen" @mousedown.prevent @click="showInitiallyOpen = !showInitiallyOpen">
      {{ showInitiallyOpen ? 'Remove initially open image' : 'Show initially open image' }}
    </button>
    <Image v-if="showInitiallyOpen" data-image-default-open :default-open="true" alt="Initially open preview image"
      :width="200" :src="src" @open-change="onDefaultOpenChange" />
    <p>Uncontrolled open changes: <output data-image-default-open-changes>{{ defaultOpenChanges }}</output>; previous → next: <output data-image-default-open-transition>{{ lastDefaultOpenChange }}</output>.</p>
  </section>
</template>
