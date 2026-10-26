<script setup lang="ts">
import {
  ConfigProvider,
  type ConfigProviderProps,
  Image,
  ImagePreviewGroup,
  type ImageSemanticType,
} from '@apollo-design/ui';
import { ref } from 'vue';
import PopupProviderDemo from '../../../packages/ui/src/image/demo/popup-provider.vue';

type Components = NonNullable<ConfigProviderProps['components']>;
const kind = ref<'image' | 'group'>('image');
const session = ref(0);
const revision = ref<'first' | 'current'>('first');
const open = ref(false);
const note = ref('Initial popup note');
const local = ref(false);
const parts = ['root', 'mask', 'body', 'footer', 'actions', 'close'] as const;
type Part = (typeof parts)[number];
const style = (part: Part, value: string) => ({ [`--popup-provider-${part}`]: value });
function makeConfig(value: string): ImageSemanticType {
  return {
    classNames: {
      popup: {
        root: `popup-provider-${value}-root`,
        mask: `popup-provider-${value}-mask`,
        body: `popup-provider-${value}-body`,
        footer: `popup-provider-${value}-footer`,
        actions: `popup-provider-${value}-actions`,
        close: `popup-provider-${value}-close`,
      },
    },
    styles: {
      popup: {
        root: style('root', value),
        mask: style('mask', value),
        body: style('body', value),
        footer: style('footer', value),
        actions: style('actions', value),
        close: style('close', value),
      },
    },
  };
}
const imageConfig = ref({ ...makeConfig('first') });
const components = ref<Components>({ image: imageConfig.value });
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
const localClasses = { popup: { root: 'popup-local-root', body: 'popup-local-body' } };
const localStyles = { popup: { root: { '--popup-local-root': 'kept' } } };
const nativeStyle = { paddingLeft: '9px' };
function mountTarget(next: 'image' | 'group') {
  kind.value = next;
  session.value++;
  open.value = false;
  note.value = 'Initial popup note';
  local.value = false;
  revision.value = 'first';
  imageConfig.value = { ...makeConfig('first') };
  components.value = { image: imageConfig.value };
}
function nextConfig() {
  revision.value = revision.value === 'first' ? 'current' : 'first';
  return makeConfig(revision.value);
}
function fields() {
  const next = nextConfig();
  imageConfig.value.classNames = next.classNames;
  imageConfig.value.styles = next.styles;
}
function replaceImage() {
  imageConfig.value = { ...nextConfig() };
  components.value.image = imageConfig.value;
}
function replaceMap() {
  imageConfig.value = { ...nextConfig() };
  components.value = { image: imageConfig.value };
}
function removeFields() {
  delete imageConfig.value.classNames;
  delete imageConfig.value.styles;
}
function addProvider() {
  revision.value = 'first';
  imageConfig.value = { ...makeConfig('first') };
  components.value = { image: imageConfig.value };
}
function mutateMask() {
  if (imageConfig.value.classNames?.popup)
    imageConfig.value.classNames.popup.mask = 'popup-provider-deep-mask';
  if (imageConfig.value.styles?.popup?.mask)
    imageConfig.value.styles.popup.mask['--popup-provider-mask'] = 'deep';
}
</script>

<template>
  <section data-image-popup-provider-fixture>
    <nav data-image-popup-controls aria-label="Popup provider fixture controls">
      <button type="button" @mousedown.prevent @click="mountTarget('image')">Mount popup image</button>
      <button type="button" @mousedown.prevent @click="mountTarget('group')">Mount popup group</button>
      <button type="button" @mousedown.prevent @click="fields">Replace popup fields</button>
      <button type="button" @mousedown.prevent @click="replaceImage">Replace popup image</button>
      <button type="button" @mousedown.prevent @click="replaceMap">Replace popup map</button>
      <button type="button" @mousedown.prevent @click="removeFields">Remove popup fields</button>
      <button type="button" @mousedown.prevent @click="delete components.image">Remove popup provider</button>
      <button type="button" @mousedown.prevent @click="addProvider">Add popup provider</button>
      <button type="button" @mousedown.prevent @click="mutateMask">Mutate popup mask</button>
      <button type="button" @mousedown.prevent @click="local = !local">Toggle local popup overrides</button>
    </nav>
    <ConfigProvider :components="components">
      <section data-image-popup-target>
        <Image v-if="kind === 'image'" :key="'image-' + session" v-model:open="open" :src="source" alt="Popup provider image" :width="180" :height="105"
          class="native-popup-root" :style="nativeStyle" data-popup-native-root data-popup-provider-trigger
          :class-names="local ? localClasses : undefined" :styles="local ? localStyles : undefined">
          <template #previewImage="info"><figure class="popup-provider-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Provider popup note" /></figure></template>
        </Image>
        <ImagePreviewGroup v-else :key="'group-' + session" v-model:open="open" class="native-popup-root" :style="nativeStyle" data-popup-native-root
          :class-names="local ? localClasses : undefined" :styles="local ? localStyles : undefined">
          <Image :src="source" alt="Popup provider group first" :width="180" :height="105" data-popup-provider-trigger />
          <Image :src="source" alt="Popup provider group second" :width="180" :height="105" />
          <template #previewImage="info"><figure class="popup-provider-frame"><component :is="info.originNode" /><input v-model="note" aria-label="Provider popup note" /></figure></template>
        </ImagePreviewGroup>
      </section>
    </ConfigProvider>
    <pre data-image-popup-state hidden>{{ JSON.stringify({ kind, session, revision, open, local, note }) }}</pre>
    <PopupProviderDemo />
  </section>
</template>

<style>
[data-image-popup-provider-fixture] { padding-top: 150px; }
[data-image-popup-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; background: var(--apollo-color-bg-container); }
[data-image-popup-target] { margin-bottom: 30px; }
.popup-provider-frame { display: flex; flex-direction: column; align-items: center; gap: var(--apollo-margin-xs); margin: 0; }
.popup-provider-frame input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
