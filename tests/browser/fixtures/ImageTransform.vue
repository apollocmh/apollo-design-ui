<script setup lang="ts">
import { Image, ImagePreviewGroup, type TransformInfo } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import TransformDemo from '../../../packages/ui/src/image/demo/transform-events.vue';

const kind = ref<'image' | 'group'>('image');
const session = ref(0);
const open = ref(false);
const enabled = ref(true);
const acceptClose = ref(true);
const revision = ref(0);
const entries = ref<Array<{ listener: string; revision: number; info: TransformInfo }>>([]);
const completed = ref<boolean[]>([]);
const source = (color: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="${color}"/></svg>`)}`;
const first = source('#38598b');
const second = source('#297373');
const preview = { afterOpenChange: (value: boolean) => completed.value.push(value) };
const listeners = computed(() => {
  const currentRevision = revision.value;
  const record = (listener: string) => (info: TransformInfo) => entries.value.push({ listener, revision: currentRevision, info });
  return {
    transform: enabled.value ? [record('first'), record('second')] : undefined,
    transformOnce: record('once'),
  };
});
function mountTarget(next: 'image' | 'group') {
  kind.value = next;
  session.value++;
  open.value = false;
  enabled.value = true;
  acceptClose.value = true;
  revision.value = 0;
  entries.value = [];
  completed.value = [];
}
function requested(next: boolean) {
  if (next || acceptClose.value) open.value = next;
}
</script>

<template>
  <section data-image-transform-fixture>
    <nav data-image-transform-controls aria-label="Transform fixture controls">
      <button type="button" @mousedown.prevent @click="mountTarget('image')">Mount transform image</button>
      <button type="button" @mousedown.prevent @click="mountTarget('group')">Mount transform group</button>
      <button type="button" @mousedown.prevent @click="revision++">Replace transform listeners</button>
      <button type="button" @mousedown.prevent @click="enabled = false">Remove transform listeners</button>
      <button type="button" @mousedown.prevent @click="enabled = true">Restore transform listeners</button>
      <button type="button" @mousedown.prevent @click="acceptClose = false">Refuse transform preview close</button>
      <button type="button" @mousedown.prevent @click="open = false">Close transform preview from parent</button>
    </nav>
    <section data-image-transform-target>
      <Image v-if="kind === 'image'" :key="'image-' + session" :src="first" alt="Browser transform image"
        :width="200" :height="116" :open="open" :preview="preview" data-transform-trigger
        v-on="listeners" @open-change="requested" />
      <ImagePreviewGroup v-else :key="'group-' + session" :open="open" :preview="preview" v-on="listeners" @open-change="requested">
        <Image :src="first" alt="Browser transform group first" :width="180" :height="105" data-transform-trigger />
        <Image :src="second" alt="Browser transform group second" :width="180" :height="105" />
      </ImagePreviewGroup>
    </section>
    <pre data-image-transform-state hidden>{{ JSON.stringify({ kind, session, open, enabled, acceptClose, revision, entries, completed }) }}</pre>
    <TransformDemo />
  </section>
</template>

<style>
[data-image-transform-fixture] { padding-top: 140px; }
[data-image-transform-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; background: white; }
[data-image-transform-target] { margin-bottom: 30px; }
</style>
