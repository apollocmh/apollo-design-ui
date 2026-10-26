<script setup lang="ts">
import { Image, ImagePreviewGroup, type PreviewConfig } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const phase = ref(0);
const labels = ['slot', 'empty slot', 'data', 'hidden', 'default'];
const note = ref('Editable preview note');
const imageOpen = ref(false);
const groupOpen = ref(false);
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
const preview = computed<PreviewConfig>(() => ({
  closable: phase.value !== 3,
  closeIcon:
    phase.value === 2
      ? h('span', { 'aria-hidden': 'true', 'data-close-demo-icon': 'data' }, '×')
      : undefined,
}));
function cycle() {
  phase.value = (phase.value + 1) % labels.length;
}
</script>

<template>
  <section data-image-close-demo>
    <button type="button" data-close-demo-cycle @mousedown.prevent @click="cycle">Cycle close control</button>
    <p>Close control: <output data-close-demo-phase>{{ labels[phase] }}</output>. Escape and the mask can still close a preview when its close button is hidden.</p>
    <Image v-model:open="imageOpen" :src="source" alt="Close control image" :width="160" :height="94" :preview="preview" data-close-demo-image>
      <template v-if="phase === 0 || phase === 1" #previewCloseIcon><span v-if="phase === 0" aria-hidden="true" data-close-demo-icon="slot">×</span></template>
      <template #previewImage="info"><figure class="close-demo-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Close control note" /></figure></template>
      <template #previewActions="info"><div class="close-demo-actions"><component :is="info.originNode" /><button type="button" @mousedown.prevent @click="cycle">Cycle close control</button></div></template>
    </Image>
    <ImagePreviewGroup v-model:open="groupOpen" :preview="preview">
      <Image :src="source" alt="Close control group first" :width="140" :height="82" data-close-demo-group />
      <Image :src="source" alt="Close control group second" :width="140" :height="82" />
      <template v-if="phase === 0 || phase === 1" #previewCloseIcon><span v-if="phase === 0" aria-hidden="true" data-close-demo-icon="slot">×</span></template>
      <template #previewImage="info"><figure class="close-demo-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Close control note" /></figure></template>
      <template #previewActions="info"><div class="close-demo-actions"><component :is="info.originNode" /><button type="button" @mousedown.prevent @click="cycle">Cycle close control</button></div></template>
    </ImagePreviewGroup>
    <output data-close-demo-state hidden>{{ JSON.stringify({ phase, imageOpen, groupOpen, note }) }}</output>
  </section>
</template>

<style scoped>
.close-demo-frame { display: flex; flex-direction: column; align-items: center; gap: var(--apollo-padding-xs); margin: 0; }
.close-demo-frame input, .close-demo-actions > button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
.close-demo-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--apollo-padding-xs); }
</style>
