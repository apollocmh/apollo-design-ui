<script setup lang="ts">
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h, ref } from 'vue';

const svg = (height: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="${height}"><rect width="160" height="${height}" fill="steelblue"/></svg>`)}`;
const image = ref(svg(20));
const updated = ref(false);
const loads = ref(0);
const bubbles = ref(0);
const errors = ref(0);
const layouts = ref(0);
const clicks = ref(0);
const items = [0, 1, 2].map(index => ({ key: String(index), data: index }));
const renderItem = ({ index }: MasonryItemRenderInfo) => index === 0
  ? h('div', [
      h('img', { src: image.value, alt: 'Dynamic tile', style: { width: '100%', display: 'block' } }),
      h('input', { 'aria-label': 'Masonry input', style: { height: '20px', width: '100%', display: 'block', boxSizing: 'border-box' } }),
    ])
  : h('div', { style: { height: index === 1 ? '60px' : '20px' } }, `Tile ${index}`);
const reset = () => { loads.value = bubbles.value = errors.value = layouts.value = clicks.value = 0; };
</script>

<template>
  <button @click="image = svg(140)">Load taller image</button>
  <button @click="updated = !updated">Update masonry attrs</button>
  <button @click="reset">Reset masonry counters</button>
  <Masonry data-native-masonry :id="updated ? 'masonry-new' : 'masonry-native'"
    :class="updated ? ['second', { active: true }] : 'first'"
    :style="updated ? 'width:320px;color:blue' : 'width:320px;color:red'"
    :items="items" :columns="2" :fresh="false" :item-render="renderItem"
    @load.capture="loads++" @load="bubbles++" @error.capture="errors++"
    @layout-change="layouts++" @click="clicks++" />
  <output id="masonry-native-state">{{ JSON.stringify({ loads, bubbles, errors, layouts, clicks }) }}</output>
</template>
