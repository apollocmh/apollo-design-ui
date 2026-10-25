<script setup lang="ts">
import { Image, ImagePreviewGroup, type PreviewConfig } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

type Target = 'Image' | 'PreviewGroup';
type Scenario = 'model' | 'refuse' | 'lazy' | 'dual';
const target = ref<Target>('Image');
const scenario = ref<Scenario>('model');
const session = ref(0);
const shown = ref(true);
const secondShown = ref(false);
const firstShown = ref(true);
const open = ref(false);
const current = ref(0);
const decorative = ref(true);
const requests = ref<Array<[boolean, boolean]>>([]);
const completed = ref<boolean[]>([]);
const icons = {
  close: h('span', { 'aria-hidden': 'true' }, '×'),
  left: h('span', { 'aria-hidden': 'true' }, '‹'),
  right: h('span', { 'aria-hidden': 'true' }, '›'),
};
const svg = (color: string, text: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><rect width="180" height="100" fill="${color}"/><text x="90" y="56" text-anchor="middle" font-family="sans-serif" font-size="18" fill="white">${text}</text></svg>`)}`;
const source = svg('#38598b', 'Focus image');
const secondSource = svg('#297373', 'Focus second');
const preview = computed<PreviewConfig>(() => ({
  cover: false,
  icons: decorative.value ? icons : undefined,
  afterOpenChange: (value) => completed.value.push(value),
}));
const mountScenario = (nextTarget: Target, nextScenario: Scenario) => {
  target.value = nextTarget;
  scenario.value = nextScenario;
  shown.value = nextScenario !== 'lazy' && nextScenario !== 'dual';
  secondShown.value = false;
  firstShown.value = true;
  open.value = false;
  current.value = 0;
  decorative.value = true;
  requests.value = [];
  completed.value = [];
  session.value++;
};
const recordRequest = (next: boolean, previous: boolean) => {
  requests.value.push([next, previous]);
  // This parent accepts opening requests while deliberately refusing close requests.
  if (scenario.value === 'refuse' && next) open.value = true;
};
</script>

<template>
  <section data-image-preview-focus-fixture>
    <nav data-image-preview-focus-controls aria-label="Image focus fixture controls">
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'model')">Mount focus image</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'model')">Mount focus group</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'refuse')">Mount refusing focus image</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'refuse')">Mount refusing focus group</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'lazy')">Prepare lazy focus image</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'lazy')">Prepare lazy focus group</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'dual')">Prepare stacked focus previews</button>
      <button type="button" @mousedown.prevent @click="secondShown = true">Open second focus preview</button>
      <button type="button" @mousedown.prevent @click="firstShown = false">Unmount first focus preview</button>
      <button type="button" @mousedown.prevent @click="open = false">Close focus preview from parent</button>
      <button type="button" @mousedown.prevent @click="shown = false">Unmount focus preview</button>
      <button type="button" @mousedown.prevent @click="decorative = !decorative">Toggle focus icons</button>
    </nav>
    <button type="button" data-image-focus-outside>Outside focus target</button>
    <button v-if="scenario === 'lazy' || scenario === 'dual'" type="button" data-image-focus-lazy-opener @click="shown = true">Show lazy focus preview</button>
    <section data-image-focus-target>
      <template v-if="shown && target === 'Image' && scenario !== 'dual'">
        <Image v-if="scenario === 'model'" :key="'image-model-' + session" v-model:open="open"
          :src="source" alt="Focus image preview" :width="180" :height="100" :preview="preview"
          data-image-focus-trigger @open-change="recordRequest" />
        <Image v-else-if="scenario === 'refuse'" :key="'image-refuse-' + session" :open="open"
          :src="source" alt="Focus image preview" :width="180" :height="100" :preview="preview"
          data-image-focus-trigger @open-change="recordRequest" />
        <Image v-else :key="'image-lazy-' + session" :default-open="true"
          :src="source" alt="Lazy focus image preview" :width="180" :height="100" :preview="preview"
          data-image-focus-trigger @open-change="recordRequest" />
      </template>
      <template v-if="shown && target === 'PreviewGroup'">
        <ImagePreviewGroup v-if="scenario === 'model'" :key="'group-model-' + session" v-model:open="open"
          v-model:current="current" :preview="preview" @open-change="recordRequest">
          <Image :src="source" alt="Focus group first" :width="150" :height="90" data-image-focus-trigger />
          <Image :src="secondSource" alt="Focus group second" :width="150" :height="90" />
        </ImagePreviewGroup>
        <ImagePreviewGroup v-else-if="scenario === 'refuse'" :key="'group-refuse-' + session" :open="open"
          v-model:current="current" :preview="preview" @open-change="recordRequest">
          <Image :src="source" alt="Focus group first" :width="150" :height="90" data-image-focus-trigger />
          <Image :src="secondSource" alt="Focus group second" :width="150" :height="90" />
        </ImagePreviewGroup>
        <ImagePreviewGroup v-else :key="'group-lazy-' + session" :default-open="true"
          v-model:current="current" :preview="preview" @open-change="recordRequest">
          <Image :src="source" alt="Lazy focus group first" :width="150" :height="90" data-image-focus-trigger />
          <Image :src="secondSource" alt="Lazy focus group second" :width="150" :height="90" />
        </ImagePreviewGroup>
      </template>
      <section v-if="shown && scenario === 'dual'" data-image-focus-stacked>
        <Image v-if="firstShown" :default-open="true" :src="source" alt="First stacked focus preview" :preview="preview" />
        <Image v-if="secondShown" :default-open="true" :src="secondSource" alt="Second stacked focus preview" :preview="preview" />
      </section>
    </section>
    <pre data-image-preview-focus-state hidden>{{ JSON.stringify({ target, scenario, session, shown, firstShown, secondShown, open, current, decorative, requests, completed }) }}</pre>
  </section>
</template>

<style>
[data-image-preview-focus-fixture] { padding-top: 160px; }
[data-image-preview-focus-controls] {
  position: fixed;
  z-index: 2000;
  inset: 0 100px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  background: white;
}
[data-image-focus-target] { margin-top: 20px; }
[data-image-focus-target] .apollo-image { margin-right: 16px; }
</style>
