<script setup lang="ts">
import { Image, ImagePreviewGroup, type TransformInfo } from '@apollo-design/ui';
import { computed, ref, shallowRef } from 'vue';

const custom = ref(true);
const empty = ref(false);
const revision = ref(0);
const open = ref(false);
const current = ref(0);
const note = ref('A note that survives image changes');
const transformed = shallowRef<TransformInfo>();
const svg = (color: string, text: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="${color}"/><text x="120" y="76" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white">${text}</text></svg>`)}`;
const first = computed(() =>
  svg(revision.value % 2 ? '#6b4b7a' : '#38598b', `First ${revision.value}`),
);
const second = svg('#297373', 'Second');
</script>

<template>
  <section data-image-preview-slots-demo>
    <p>
      <button type="button" @mousedown.prevent @click="custom = !custom">Toggle custom preview slots</button>
      <button type="button" @mousedown.prevent @click="empty = !empty">Empty preview slots</button>
      <button type="button" @mousedown.prevent @click="revision++">Update preview sources</button>
    </p>
    <ImagePreviewGroup v-model:open="open" v-model:current="current" @transform="info => transformed = info">
      <Image :src="first" :alt="`Preview slot first ${revision}`" :width="180" :height="105" data-preview-demo-first />
      <Image :src="second" alt="Preview slot second" :width="180" :height="105" />
      <template v-if="custom" #previewImage="info">
        <figure v-if="!empty" data-preview-demo-image>
          <component :is="info.originNode" />
          <figcaption>{{ info.alt }} · {{ info.current + 1 }} / {{ info.total }}</figcaption>
          <input v-model="note" aria-label="Preview caption" />
        </figure>
      </template>
      <template v-if="custom" #previewActions="info">
        <section v-if="!empty" data-preview-demo-actions>
          <component :is="info.originNode" />
          <button type="button" @click="info.actions.reset">Reset preview transform</button>
          <button type="button" :disabled="info.disabled.zoomIn" @click="info.actions.zoomIn">Custom preview zoom</button>
        </section>
      </template>
      <template v-if="custom" #previewCount="info">
        <p v-if="!empty" data-preview-demo-count>Image {{ info.current + 1 }} of {{ info.total }}</p>
      </template>
    </ImagePreviewGroup>
    <p>Preview {{ open ? 'open' : 'closed' }}; selected index {{ current }}.</p>
    <output data-image-preview-slots-demo-state hidden>{{ JSON.stringify({ custom, empty, revision, open, current, note, transformed }) }}</output>
  </section>
</template>

<style scoped>
[data-preview-demo-image] { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 0; padding: var(--apollo-padding-sm); color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-demo-image] input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-demo-actions] { display: flex; align-items: center; gap: 8px; }
[data-preview-demo-actions] > button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-demo-count] { padding: var(--apollo-padding-xs); text-align: center; color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
