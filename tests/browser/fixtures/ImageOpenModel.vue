<script setup lang="ts">
import { Image, ImagePreviewGroup } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import ControlledImageDemo from '../../../packages/ui/src/image/demo/controlled-preview.vue';
import ControlledGroupDemo from '../../../packages/ui/src/image/demo/preview-group-visible.vue';

type Target = 'Image' | 'PreviewGroup';
type Scenario = 'model' | 'refuse' | 'uncontrolled';
interface Entry { listener: string; revision: number; next: boolean | number; previous?: boolean | number }
const target = ref<Target>('Image');
const scenario = ref<Scenario>('model');
const session = ref(0);
const open = ref(false);
const refusedOpen = ref(false);
const defaultSeed = ref(true);
const current = ref(0);
const listenerRevision = ref(0);
const entries = ref<Entry[]>([]);
const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><rect width="180" height="100" fill="${color}"/><text x="90" y="56" text-anchor="middle" font-family="sans-serif" font-size="17" fill="white">${label}</text></svg>`)}`;
const source = svgSource('#38598b', 'Image model');
const groupItems = [svgSource('#297373', 'First'), svgSource('#6b4b7a', 'Second'), svgSource('#7a5b4b', 'Third')]
  .map((src, index) => ({ src, alt: `Group model image ${index + 1}` }));
const mountScenario = (nextTarget: Target, nextScenario: Scenario, initiallyOpen = false) => {
  target.value = nextTarget;
  scenario.value = nextScenario;
  open.value = initiallyOpen;
  refusedOpen.value = false;
  defaultSeed.value = true;
  current.value = 0;
  listenerRevision.value = 0;
  entries.value = [];
  session.value++;
};
const listeners = computed(() => {
  const revision = listenerRevision.value;
  const recordOpen = (listener: string) => (next: boolean, previous?: boolean) =>
    entries.value.push({ listener, revision, next, previous });
  const recordCurrent = (listener: string) => (next: number, previous?: number) =>
    entries.value.push({ listener, revision, next, previous });
  const openEvents = {
    openChange: [recordOpen('open-change'), recordOpen('open-change-secondary')],
    openChangeOnce: recordOpen('open-change-once'),
    'update:open': [recordOpen('update:open'), recordOpen('update:open-secondary')],
    'update:openOnce': recordOpen('update:open-once'),
  };
  return target.value === 'Image' ? openEvents : {
    ...openEvents,
    change: [recordCurrent('change'), recordCurrent('change-secondary')],
    changeOnce: recordCurrent('change-once'),
    'update:current': [recordCurrent('update:current'), recordCurrent('update:current-secondary')],
    'update:currentOnce': recordCurrent('update:current-once'),
  };
});
</script>

<template>
  <section data-image-open-model-fixture>
    <nav data-image-open-model-controls aria-label="Image model controls">
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'model')">Mount image model closed</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'model', true)">Mount image model open</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'model')">Mount group model closed</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'model', true)">Mount group model open</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'refuse')">Mount refusing image</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'refuse')">Mount refusing group</button>
      <button type="button" @mousedown.prevent @click="mountScenario('Image', 'uncontrolled')">Mount default-open image</button>
      <button type="button" @mousedown.prevent @click="mountScenario('PreviewGroup', 'uncontrolled')">Mount default-open group</button>
      <button type="button" @mousedown.prevent @click="open = true">Set parent model open</button>
      <button type="button" @mousedown.prevent @click="open = false">Set parent model closed</button>
      <button type="button" @mousedown.prevent @click="refusedOpen = true">Accept controlled open</button>
      <button type="button" @mousedown.prevent @click="refusedOpen = false">Accept controlled close</button>
      <button type="button" @mousedown.prevent @click="defaultSeed = !defaultSeed">Toggle default seed</button>
      <button type="button" @mousedown.prevent @click="current = (current + 1) % groupItems.length">Set parent group index</button>
      <button type="button" @mousedown.prevent @click="listenerRevision++">Replace model listeners</button>
    </nav>
    <section data-image-open-model-target>
      <template v-if="target === 'Image'">
        <Image v-if="scenario === 'model'" :key="'image-model-' + session" v-model:open="open" :src="source"
          alt="Image model preview" :width="180" :height="100" v-on="listeners" />
        <Image v-else-if="scenario === 'refuse'" :key="'image-refuse-' + session" :open="refusedOpen" :default-open="true" :src="source"
          alt="Image model preview" :width="180" :height="100" v-on="listeners" />
        <Image v-else :key="'image-uncontrolled-' + session" :default-open="defaultSeed" :src="source"
          alt="Image model preview" :width="180" :height="100" v-on="listeners" />
      </template>
      <template v-else>
        <ImagePreviewGroup v-if="scenario === 'model'" :key="'group-model-' + session" v-model:open="open" v-model:current="current"
          v-on="listeners">
          <Image v-for="(item, index) in groupItems" :key="item.src" :src="item.src" :alt="item.alt"
            :width="150" :height="90" :data-model-group-index="index" :preview="{ cover: false }" />
        </ImagePreviewGroup>
        <ImagePreviewGroup v-else-if="scenario === 'refuse'" :key="'group-refuse-' + session" :open="refusedOpen" :default-open="true" v-model:current="current"
          v-on="listeners">
          <Image v-for="(item, index) in groupItems" :key="item.src" :src="item.src" :alt="item.alt"
            :width="150" :height="90" :data-model-group-index="index" :preview="{ cover: false }" />
        </ImagePreviewGroup>
        <ImagePreviewGroup v-else :key="'group-uncontrolled-' + session" :default-open="defaultSeed" v-model:current="current"
          v-on="listeners">
          <Image v-for="(item, index) in groupItems" :key="item.src" :src="item.src" :alt="item.alt"
            :width="150" :height="90" :data-model-group-index="index" :preview="{ cover: false }" />
        </ImagePreviewGroup>
      </template>
    </section>
    <pre data-image-open-model-state hidden>{{ JSON.stringify({ target, scenario, session, open, refusedOpen, defaultSeed, current, listenerRevision, entries }) }}</pre>
  </section>
  <section data-open-model-image-demo><ControlledImageDemo /></section>
  <section data-open-model-group-demo><ControlledGroupDemo /></section>
</template>

<style>
[data-image-open-model-fixture] { padding-top: 180px; }
[data-image-open-model-controls] {
  position: fixed;
  z-index: 2000;
  inset: 0 100px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  background: white;
}
[data-open-model-image-demo], [data-open-model-group-demo] { margin-top: 32px; }
</style>
