<script setup lang="ts">
import { Image, ImagePreviewGroup, type PreviewConfig, type TransformInfo } from '@apollo-design/ui';
import { ref, shallowRef } from 'vue';
import TransformDemo from '../../../packages/ui/src/image/demo/transform-events.vue';

const kind = ref<'image' | 'group'>('image');
const epoch = ref(0);
const preview = shallowRef<PreviewConfig>({});
const events = ref<TransformInfo[]>([]);
const note = ref('Initial scale note');
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
function mountTarget(next: 'image' | 'group') { kind.value = next; epoch.value++; preview.value = {}; events.value = []; note.value = 'Initial scale note'; }
</script>

<template>
  <section data-image-scale-fixture>
    <nav data-image-scale-controls aria-label="Scale bounds controls">
      <button type="button" @mousedown.prevent @click="mountTarget('image')">Mount scale image</button>
      <button type="button" @mousedown.prevent @click="mountTarget('group')">Mount scale group</button>
      <button type="button" @mousedown.prevent @click="preview = { minScale: 1, maxScale: 1.05 }">Use tight bounds</button>
      <button type="button" @mousedown.prevent @click="preview = { minScale: 1, maxScale: 2 }">Use expanded bounds</button>
      <button type="button" @mousedown.prevent @click="preview = { minScale: 1.15, maxScale: 2 }">Use higher minimum</button>
      <button type="button" @mousedown.prevent @click="preview = {}">Remove scale limits</button>
    </nav>
    <section data-image-scale-target>
      <Image v-if="kind === 'image'" :key="epoch" :src="source" alt="Scale preview image" :width="180" :height="105" :preview="preview" data-scale-trigger @transform="events.push($event)">
        <template #previewImage="info"><figure class="scale-preview-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Scale preview note" /></figure></template>
        <template #previewActions="info"><div><component :is="info.originNode" /><button type="button" data-scale-reset @click="info.actions.reset">Reset scale</button><output data-scale-zoom-in-disabled hidden>{{ info.disabled.zoomIn }}</output></div></template>
      </Image>
      <ImagePreviewGroup v-else :key="epoch" :preview="preview" @transform="events.push($event)">
        <Image :src="source" alt="Scale group first" :width="180" :height="105" data-scale-trigger />
        <Image :src="source" alt="Scale group second" :width="180" :height="105" />
        <template #previewImage="info"><figure class="scale-preview-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Scale preview note" /></figure></template>
        <template #previewActions="info"><div><component :is="info.originNode" /><button type="button" data-scale-reset @click="info.actions.reset">Reset scale</button><output data-scale-zoom-in-disabled hidden>{{ info.disabled.zoomIn }}</output></div></template>
      </ImagePreviewGroup>
    </section>
    <pre data-image-scale-state hidden>{{ JSON.stringify({ kind, epoch, preview, events, note }) }}</pre>
    <TransformDemo />
  </section>
</template>

<style>
[data-image-scale-fixture] { padding-top: 110px; }
[data-image-scale-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; background: var(--apollo-color-bg-container); }
.scale-preview-frame { display: flex; flex-direction: column; align-items: center; gap: var(--apollo-margin-xs); margin: 0; }
.scale-preview-frame input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-scale-reset] { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
