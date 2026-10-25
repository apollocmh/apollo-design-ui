<script setup lang="ts">
import { Image, ImagePreviewGroup, type PreviewConfig, type TransformInfo } from '@apollo-design/ui';
import { computed, ref, shallowRef } from 'vue';

const imageChanges = ref(0);
const groupChanges = ref(0);
const imageOnce = ref(0);
const groupOnce = ref(0);
const last = shallowRef<{ source: string; transform: TransformInfo } | null>(null);
const boundsMode = ref(0);
const preview = computed<PreviewConfig>(() => boundsMode.value === 1 ? { minScale: 1, maxScale: 1.05 } : boundsMode.value === 2 ? { minScale: 1.15, maxScale: 2 } : {});
function cycleBounds() { boundsMode.value = (boundsMode.value + 1) % 3; }
const source = (color: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="110"><rect width="180" height="110" fill="${color}"/></svg>`)}`;
const first = source('#38598b');
const second = source('#297373');
function recordImage(info: TransformInfo) {
  imageChanges.value++;
  last.value = { source: 'Image', transform: info };
}
function recordGroup(info: TransformInfo) {
  groupChanges.value++;
  last.value = { source: 'PreviewGroup', transform: info };
}
</script>

<template>
  <section data-image-transform-demo>
    <p>Open a preview and rotate, flip or zoom its image. Closing resets the transform and emits that snapshot.</p>
    <button type="button" @mousedown.prevent @click="cycleBounds">Cycle preview bounds</button>
    <p>Current bounds: <output data-transform-demo-bounds>{{ boundsMode === 1 ? '1–1.05' : boundsMode === 2 ? '1.15–2' : 'default' }}</output>. A bound change applies on the next transform action.</p>
    <Image :src="first" alt="Transform event image" :width="180" :height="110"
      :preview="preview" data-transform-demo-image @transform="recordImage" @transform.once="imageOnce++">
      <template #previewActions="info"><div class="transform-demo-toolbar"><component :is="info.originNode" /><button type="button" @click="cycleBounds">Cycle preview bounds</button></div></template>
    </Image>
    <ImagePreviewGroup :preview="preview" @transform="recordGroup" @transform.once="groupOnce++">
      <Image :src="first" alt="Transform event group first" :width="140" :height="86" data-transform-demo-group-first />
      <Image :src="second" alt="Transform event group second" :width="140" :height="86" />
      <template #previewActions="info"><div class="transform-demo-toolbar"><component :is="info.originNode" /><button type="button" @click="cycleBounds">Cycle preview bounds</button></div></template>
    </ImagePreviewGroup>
    <p>Image events: {{ imageChanges }} (once: {{ imageOnce }}); group events: {{ groupChanges }} (once: {{ groupOnce }}).</p>
    <pre>{{ last ? JSON.stringify(last, null, 2) : 'No transform yet' }}</pre>
    <output data-image-transform-demo-state hidden>{{ JSON.stringify({ imageChanges, groupChanges, imageOnce, groupOnce, last }) }}</output>
  </section>
</template>

<style scoped>
.transform-demo-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--apollo-padding-xs); }
.transform-demo-toolbar > button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
