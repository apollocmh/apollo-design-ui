<script setup lang="ts">
import { ConfigProvider, Image, ImagePreviewGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100" viewBox="0 0 180 100"><rect width="180" height="100" fill="${color}"/><text x="90" y="56" text-anchor="middle" font-family="sans-serif" font-size="17" fill="white">${label}</text></svg>`)}`;
const standaloneSource = svgSource('#38598b', 'Standalone');
const richSource = svgSource('#297373', 'Rich content');
const firstGroupSource = svgSource('#6b4b7a', 'Group first');
const secondGroupSource = svgSource('#7a5b4b', 'Group second');
const providerPrefix = ref<string | undefined>('p1');
const imagePrefix = ref<string | undefined>('override-a-image');
const groupPreviewPrefix = ref<string | undefined>('group-a-image-preview');
const replaceImagePrefix = () => {
  imagePrefix.value =
    imagePrefix.value === 'override-a-image' ? 'override-b-image' : 'override-a-image';
};
const replaceProviderPrefix = () => {
  providerPrefix.value = providerPrefix.value === 'p1' ? 'p2' : 'p1';
};
const replaceGroupPreviewPrefix = () => {
  groupPreviewPrefix.value =
    groupPreviewPrefix.value === 'group-a-image-preview'
      ? 'group-b-image-preview'
      : 'group-a-image-preview';
};
</script>

<template>
  <section data-image-prefix-fixture>
    <!-- Fixture controls remain clickable above open previews; no forced browser clicks. -->
    <nav data-image-prefix-controls aria-label="Image prefix controls">
      <button type="button" @mousedown.prevent @click="replaceImagePrefix">Replace image prefix</button>
      <button type="button" @mousedown.prevent @click="imagePrefix = undefined">Remove image prefix</button>
      <button type="button" @mousedown.prevent @click="replaceProviderPrefix">Replace image provider prefix</button>
      <button type="button" @mousedown.prevent @click="providerPrefix = undefined">Remove image provider prefix</button>
      <button type="button" @mousedown.prevent @click="replaceGroupPreviewPrefix">Replace group preview prefix</button>
      <button type="button" @mousedown.prevent @click="groupPreviewPrefix = undefined">Remove group preview prefix</button>
    </nav>
    <p>DOM prefixes update; this test page explicitly preloads CSS for its finite namespaces. D04 remains open.</p>
    <ConfigProvider :prefix-cls="providerPrefix">
      <div class="image-prefix-examples">
        <Image data-prefix-entry="standalone" :prefix-cls="imagePrefix" :src="standaloneSource"
          alt="Prefix standalone preview" :width="150" :height="90" :preview="{ mask: false }" />
        <Image data-prefix-entry="rich" :prefix-cls="imagePrefix" :src="richSource"
          alt="Prefix rich image" :width="180" :height="100" :preview="false" :styles="{ root: { height: 'auto' } }">
          <template #imageRender="{ originNode }">
            <figure class="image-prefix-rich"><component :is="originNode" />
              <figcaption>Stable native image content</figcaption>
              <input aria-label="Image prefix draft" />
            </figure>
          </template>
        </Image>
        <Image data-prefix-entry="progress" :prefix-cls="imagePrefix" :width="150" :height="90"
          :placeholder="{ progress: { percent: 42 } }" :preview="false" />
        <Image data-prefix-entry="busy" :width="150" :height="90"
          :placeholder="{ progress: true }" :preview="false" />
        <Image data-prefix-entry="placeholder" :prefix-cls="imagePrefix" :width="150" :height="90"
          placeholder="Waiting for prefix image" :preview="false" />
      </div>
      <ImagePreviewGroup data-image-prefix-group :preview-prefix-cls="groupPreviewPrefix" :preview="{ mask: false }">
        <Image data-prefix-entry="group-first" :src="firstGroupSource" alt="First prefix group image"
          :width="150" :height="90" :preview="{ cover: false }" />
        <Image data-prefix-entry="group-second" :src="secondGroupSource" alt="Second prefix group image"
          :width="150" :height="90" :preview="{ cover: false }" />
      </ImagePreviewGroup>
    </ConfigProvider>
  </section>
</template>

<style>
[data-image-prefix-fixture] { padding-top: 110px; }
[data-image-prefix-controls] {
  position: fixed;
  z-index: 2000;
  /* Leave the real preview close button at the right edge unobstructed. */
  inset: 0 100px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: white;
}
.image-prefix-examples { margin-bottom: 24px; }
/* Keep examples out of flex/grid layout so computed inline-block remains observable. */
.image-prefix-examples > * { vertical-align: top; margin: 0 16px 16px 0; }
.image-prefix-rich { margin: 0; }
.image-prefix-rich input { box-sizing: border-box; width: 100%; }
</style>
