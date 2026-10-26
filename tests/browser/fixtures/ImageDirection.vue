<script setup lang="ts">
import { ConfigProvider, Image, ImagePreviewGroup, type PreviewConfig } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';
import PopupProviderDemo from '../../../packages/ui/src/image/demo/popup-provider.vue';

const direction = ref<'ltr' | 'rtl'>('ltr');
const mode = ref<'default' | 'custom' | 'partial' | 'empty'>('default');
const epoch = ref(0);
const open = ref(false);
const current = ref(0);
const note = ref('Initial direction note');
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
const left = h('span', { 'data-direction-icon': 'left', 'aria-hidden': 'true' }, 'L');
const right = h('span', { 'data-direction-icon': 'right', 'aria-hidden': 'true' }, 'R');
const preview = computed<PreviewConfig>(() =>
  mode.value === 'custom'
    ? { icons: { left, right } }
    : mode.value === 'partial'
      ? { icons: { left } }
      : mode.value === 'empty'
        ? { icons: { left: null } }
        : {},
);
function mountGallery(next: 'ltr' | 'rtl') {
  direction.value = next;
  mode.value = 'default';
  epoch.value++;
  open.value = false;
  current.value = 0;
  note.value = 'Initial direction note';
}
</script>

<template>
  <section data-image-direction-fixture>
    <nav data-image-direction-controls aria-label="Gallery direction controls">
      <button type="button" @mousedown.prevent @click="mountGallery('ltr')">Mount LTR gallery</button>
      <button type="button" @mousedown.prevent @click="mountGallery('rtl')">Mount RTL gallery</button>
      <button type="button" @mousedown.prevent @click="direction = direction === 'ltr' ? 'rtl' : 'ltr'">Toggle gallery direction</button>
      <button type="button" @mousedown.prevent @click="mode = 'custom'">Use custom gallery icons</button>
      <button type="button" @mousedown.prevent @click="mode = 'partial'">Use partial gallery icons</button>
      <button type="button" @mousedown.prevent @click="mode = 'empty'">Use empty gallery icon</button>
      <button type="button" @mousedown.prevent @click="mode = 'default'">Use default gallery icons</button>
    </nav>
    <ConfigProvider :direction="direction">
      <section data-image-direction-target>
        <ImagePreviewGroup :key="epoch" v-model:open="open" v-model:current="current" :preview="preview">
          <Image :src="source" alt="Direction gallery first" :width="180" :height="105" data-direction-trigger />
          <Image :src="source" alt="Direction gallery second" :width="180" :height="105" />
          <Image :src="source" alt="Direction gallery third" :width="180" :height="105" />
          <template #previewImage="info"><figure class="direction-preview-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Gallery direction note" /></figure></template>
        </ImagePreviewGroup>
      </section>
    </ConfigProvider>
    <pre data-image-direction-state hidden>{{ JSON.stringify({ direction, mode, epoch, open, current, note }) }}</pre>
    <PopupProviderDemo />
  </section>
</template>

<style>
[data-image-direction-fixture] { padding-top: 130px; }
[data-image-direction-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; background: var(--apollo-color-bg-container); }
[data-image-direction-target] { margin-bottom: 30px; }
.direction-preview-frame { display: flex; flex-direction: column; align-items: center; gap: var(--apollo-margin-xs); margin: 0; }
.direction-preview-frame input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
