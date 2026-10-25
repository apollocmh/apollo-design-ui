<script setup lang="ts">
import { Image, ImagePreviewGroup } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import ImageRenderDemo from '../../../packages/ui/src/image/demo/image-render.vue';

const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect width="160" height="100" fill="${color}"/><text x="80" y="56" text-anchor="middle" font-family="sans-serif" font-size="16" fill="white">${label}</text></svg>`)}`;
const standalone = svgSource('#5b4b8a', 'Standalone');
const groupSecond = svgSource('#8a5b4b', 'Group second');
const groupRevision = ref(0);
const groupSource = computed(() => svgSource('#437a6b', `Group ${groupRevision.value}`));
const groupAlt = computed(() => `Group rendered image ${groupRevision.value}`);
</script>

<template>
  <ImageRenderDemo />
  <section data-standalone-preview>
    <Image :width="120" :height="80" :src="standalone" alt="Standalone render preview" :preview="{ cover: false }">
      <template #imageRender="{ originNode }"><component :is="originNode" /></template>
    </Image>
  </section>
  <p><button type="button" @mousedown.prevent @click="groupRevision++">Update group image</button></p>
  <ImagePreviewGroup>
    <section data-group-render-first>
      <Image :width="120" :height="80" :src="groupSource" :alt="groupAlt" :preview="{ cover: false }">
        <template #imageRender="{ originNode, src }"><span data-group-image-render :data-group-src="src"><component :is="originNode" /></span></template>
      </Image>
    </section>
    <section data-group-render-second><Image :width="120" :height="80" :src="groupSecond" alt="Group plain image" :preview="{ cover: false }" /></section>
  </ImagePreviewGroup>
</template>
