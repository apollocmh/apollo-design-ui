<script setup lang="ts">
import { Image, ImagePreviewGroup, type TransformInfo } from '@apollo-design/ui';
import { computed, ref, shallowRef } from 'vue';
import PreviewSlotsDemo from '../../../packages/ui/src/image/demo/preview-group-top-progress.vue';

const kind = ref<'image' | 'group'>('image');
const session = ref(0);
const revision = ref(0);
const open = ref(false);
const current = ref(0);
const present = ref(true);
const empty = ref(false);
const note = ref('Initial note');
const transformed = shallowRef<TransformInfo>();
const completed = ref<boolean[]>([]);
const svg = (color: string, text: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="${color}"/><text x="120" y="76" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white">${text}</text></svg>`)}`;
const first = computed(() =>
  svg(revision.value % 2 ? '#6b4b7a' : '#38598b', `First ${revision.value}`),
);
const second = svg('#297373', 'Second');
const preview = { afterOpenChange: (value: boolean) => completed.value.push(value) };
function mountTarget(next: 'image' | 'group') {
  kind.value = next;
  session.value++;
  revision.value = 0;
  open.value = false;
  current.value = 0;
  present.value = true;
  empty.value = false;
  note.value = 'Initial note';
  transformed.value = undefined;
  completed.value = [];
}
</script>

<template>
  <section data-image-preview-slots-fixture>
    <nav data-image-preview-slots-controls aria-label="Preview slot fixture controls">
      <button type="button" @mousedown.prevent @click="mountTarget('image')">Mount preview slot image</button>
      <button type="button" @mousedown.prevent @click="mountTarget('group')">Mount preview slot group</button>
      <button type="button" @mousedown.prevent @click="revision++">Update live preview content</button>
      <button type="button" @mousedown.prevent @click="present = !present">Toggle preview slot presence</button>
      <button type="button" @mousedown.prevent @click="empty = !empty">Toggle empty preview slots</button>
    </nav>
    <section data-image-preview-slots-target>
      <Image v-if="kind === 'image'" :key="'image-' + session" v-model:open="open" :src="first" :alt="`Slot first ${revision}`"
        :width="180" :height="105" :preview="preview" data-preview-slots-trigger @transform="info => transformed = info">
        <template v-if="present" #previewImage="info">
          <figure v-if="!empty" data-preview-custom-image>
            <component :is="info.originNode" />
            <input v-model="note" aria-label="Live preview note" />
            <div contenteditable="true" role="textbox" aria-label="Rich preview note">Rich note</div>
            <figcaption>{{ revision }}:{{ info.alt }} {{ info.current + 1 }} / {{ info.total }}</figcaption>
          </figure>
        </template>
        <template v-if="present" #previewActions="info">
          <section v-if="!empty" data-preview-custom-actions>
            <component :is="info.originNode" />
            <button type="button" @click="info.actions.rotateRight">Slot rotate</button>
            <button type="button" @click="info.actions.reset">Slot reset</button>
            <button type="button" @click="info.actions.close">Slot close</button>
          </section>
        </template>
      </Image>
      <ImagePreviewGroup v-else :key="'group-' + session" v-model:open="open" v-model:current="current" :preview="preview" @transform="info => transformed = info">
        <Image :src="first" :alt="`Slot first ${revision}`" :width="180" :height="105" data-preview-slots-trigger />
        <Image :src="second" alt="Slot second" :width="180" :height="105" />
        <template v-if="present" #previewImage="info">
          <figure v-if="!empty" data-preview-custom-image>
            <component :is="info.originNode" />
            <input v-model="note" aria-label="Live preview note" />
            <div contenteditable="true" role="textbox" aria-label="Rich preview note">Rich note</div>
            <figcaption>{{ revision }}:{{ info.alt }} {{ info.current + 1 }} / {{ info.total }}</figcaption>
          </figure>
        </template>
        <template v-if="present" #previewActions="info">
          <section v-if="!empty" data-preview-custom-actions>
            <component :is="info.originNode" />
            <button type="button" @click="info.actions.rotateRight">Slot rotate</button>
            <button type="button" @click="info.actions.reset">Slot reset</button>
            <button type="button" @click="info.actions.close">Slot close</button>
          </section>
        </template>
        <template v-if="present" #previewCount="info">
          <p v-if="!empty" data-preview-custom-count>{{ info.current + 1 }} of {{ info.total }}</p>
        </template>
      </ImagePreviewGroup>
    </section>
    <pre data-image-preview-slots-state hidden>{{ JSON.stringify({ kind, session, revision, open, current, present, empty, note, transformed, completed }) }}</pre>
    <PreviewSlotsDemo />
  </section>
</template>

<style>
[data-image-preview-slots-fixture] { padding-top: 130px; }
[data-image-preview-slots-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; background: white; }
[data-image-preview-slots-target] { margin-bottom: 30px; }
[data-preview-custom-image] { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 0; padding: var(--apollo-padding-sm); color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-custom-image] input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-custom-actions] { display: flex; align-items: center; gap: 6px; }
[data-preview-custom-actions] > button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-preview-custom-count] { padding: var(--apollo-padding-xs); text-align: center; color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
