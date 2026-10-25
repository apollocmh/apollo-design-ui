<script setup lang="ts">
import { Image } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect width="240" height="140" fill="${color}"/><text x="120" y="76" text-anchor="middle" font-family="sans-serif" font-size="22" fill="white">${label}</text></svg>`)}`;
const firstSource = svgSource('#38598b', 'First image');
const nextSource = svgSource('#297373', 'Current image');
const revision = ref(0);
const show = ref(true);
const empty = ref(false);
const loads = ref(0);
const errors = ref(0);
const src = computed(() => revision.value % 2 === 0 ? firstSource : nextSource);
const alt = computed(() => `Custom image ${revision.value}`);
const width = computed(() => 200 + revision.value * 20);
const height = computed(() => 120 + revision.value * 10);
</script>

<template>
  <section data-image-render-demo>
    <p>
      <button type="button" @mousedown.prevent @click="revision++">Update image content</button>
      <button type="button" @mousedown.prevent @click="empty = !empty">Empty image render slot</button>
      <button type="button" @mousedown.prevent @click="show = !show">Toggle image render slot</button>
    </p>
    <Image :alt="alt" :width="width" :height="height" :src="src" :title="`Image title ${revision}`" :preview="false"
      :class-names="{ image: `native-render-image-${revision}` }"
      :styles="{ root: { height: 'auto' }, image: { objectFit: 'cover' } }" @error="errors++">
      <template v-if="show" #imageRender="info">
        <figure v-if="!empty" class="image-render-frame" data-native-image-render
          :data-image-src="info.src" :data-image-title="info.title" :data-image-class="info.classNames.image">
          <component :is="info.originNode" @load="loads++" />
          <figcaption data-native-image-caption>Caption {{ revision }} · {{ info.alt }} · {{ info.width }} × {{ info.height }}</figcaption>
          <input aria-label="Image render note" @click.stop @keydown.stop />
        </figure>
      </template>
    </Image>
    <p>Native load events: <output data-image-render-loads>{{ loads }}</output>; error callbacks: <output data-image-render-errors>{{ errors }}</output></p>
  </section>
</template>

<style scoped>
.image-render-frame {
  display: flex;
  flex-direction: column;
  gap: var(--apollo-margin-xs);
  margin: 0;
}
.image-render-frame figcaption {
  color: var(--apollo-color-text-description);
}
.image-render-frame input {
  box-sizing: border-box;
  width: 100%;
}
</style>
