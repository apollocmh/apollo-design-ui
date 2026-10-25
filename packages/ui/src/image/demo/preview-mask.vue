<script setup lang="ts">
import { Image, type PreviewConfig } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const phase = ref(0);
const container = ref<HTMLElement | null>(null);
const local = ref(false);
const preview = computed<PreviewConfig>(() => ({
  mask:
    phase.value === 2
      ? false
      : {
          blur: phase.value === 0,
          className: 'image-demo-mask',
          style: { background: phase.value === 0 ? 'rgb(20 35 55 / 70%)' : 'rgb(40 25 45 / 60%)' },
        },
  scaleStep: phase.value === 0 ? 0.5 : 0.25,
  ...(local.value && container.value
    ? { getContainer: () => container.value ?? document.body }
    : {}),
}));

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
</script>

<template>
  <section data-image-mask-demo>
    <div>
      <button type="button" @mousedown.prevent @click="phase = (phase + 1) % 3">Cycle mask and zoom step</button>
      <label><input v-model="local" type="checkbox" /> Use local preview container</label>
    </div>
    <Image alt="Mask configuration example" :width="200" :src="src" :preview="preview">
      <template #previewActions="info">
        <component :is="info.originNode" />
        <div class="image-demo-mask-controls">
          <button type="button" @click="phase = (phase + 1) % 3">Cycle mask and zoom step</button>
          <output>Step: {{ preview.scaleStep }}</output>
        </div>
      </template>
    </Image>
    <div ref="container" data-image-mask-container />
  </section>
</template>

<style>
.image-demo-mask-controls { display: flex; align-items: center; gap: var(--apollo-margin-xs); padding: var(--apollo-padding-xs); color: var(--apollo-color-text-light-solid); background: var(--apollo-color-bg-spotlight); }
.image-demo-mask-controls button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
