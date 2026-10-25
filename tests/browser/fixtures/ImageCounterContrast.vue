<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, defaultAlgorithm, ThemeProvider } from '@apollo-design/theme';
import { Image, ImagePreviewGroup } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import PreviewGroupDemo from '../../../packages/ui/src/image/demo/preview-group.vue';

const mask = ref(true);
const current = ref(0);
const algorithms = { light: defaultAlgorithm, dark: darkAlgorithm, compact: compactAlgorithm, 'dark-compact': [darkAlgorithm, compactAlgorithm] };
type ThemeName = keyof typeof algorithms;
const names = ['light', 'dark', 'compact', 'dark-compact'] as const;
const themeName = ref<ThemeName>('light');
const theme = computed(() => ({ algorithm: algorithms[themeName.value] }));
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
</script>

<template>
  <section data-image-counter-fixture>
    <nav data-image-counter-controls aria-label="Counter contrast controls">
      <button v-for="name in names" :key="name" type="button" @mousedown.prevent @click="themeName = name">Use {{ name }} theme</button>
      <button type="button" @mousedown.prevent @click="mask = !mask">Toggle counter mask</button>
    </nav>
    <ThemeProvider :theme="theme" inject-css-var>
      <div data-image-counter-target>
        <ImagePreviewGroup v-model:current="current" :preview="{ mask }">
          <Image v-for="index in 3" :key="index" :src="source" :alt="`Counter image ${index}`" :width="160" :height="94" :data-counter-trigger="index" />
        </ImagePreviewGroup>
      </div>
      <section data-image-counter-demo><PreviewGroupDemo /></section>
    </ThemeProvider>
    <output data-image-counter-state hidden>{{ JSON.stringify({ theme: themeName, mask, current }) }}</output>
  </section>
</template>

<style>
[data-image-counter-fixture] { padding-top: 80px; }
[data-image-counter-controls] { position: fixed; z-index: 2000; inset: 0 100px auto 0; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
[data-image-counter-demo] { margin-top: 30px; }
</style>
