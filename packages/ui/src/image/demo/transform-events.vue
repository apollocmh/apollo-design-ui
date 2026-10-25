<script setup lang="ts">
import { Image, ImagePreviewGroup, type TransformInfo } from '@apollo-design/ui';
import { ref, shallowRef } from 'vue';

const imageChanges = ref(0);
const groupChanges = ref(0);
const imageOnce = ref(0);
const groupOnce = ref(0);
const last = shallowRef<{ source: string; transform: TransformInfo } | null>(null);
const source = (color: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="110"><rect width="180" height="110" fill="${color}"/></svg>`)}`;
const first = source('#38598b');
const second = source('#297373');
function recordImage(info: TransformInfo) {
  imageChanges.value++;
  last.value = { source: 'Image', transform: info };
}
function recordGroup(info: TransformInfo) {
  groupChanges.value++;
  last.value = { source: 'PreviewGroup', transform: info };
}
</script>

<template>
  <section data-image-transform-demo>
    <p>Open a preview and rotate, flip or zoom its image. Closing resets the transform and emits that snapshot.</p>
    <Image :src="first" alt="Transform event image" :width="180" :height="110"
      data-transform-demo-image @transform="recordImage" @transform.once="imageOnce++" />
    <ImagePreviewGroup @transform="recordGroup" @transform.once="groupOnce++">
      <Image :src="first" alt="Transform event group first" :width="140" :height="86" data-transform-demo-group-first />
      <Image :src="second" alt="Transform event group second" :width="140" :height="86" />
    </ImagePreviewGroup>
    <p>Image events: {{ imageChanges }} (once: {{ imageOnce }}); group events: {{ groupChanges }} (once: {{ groupOnce }}).</p>
    <pre>{{ last ? JSON.stringify(last, null, 2) : 'No transform yet' }}</pre>
    <output data-image-transform-demo-state hidden>{{ JSON.stringify({ imageChanges, groupChanges, imageOnce, groupOnce, last }) }}</output>
  </section>
</template>
