<script setup lang="ts">
import { Masonry } from '@apollo-design/ui';
import { ref } from 'vue';

const svg = (height: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="${height}"><rect width="160" height="${height}" fill="steelblue"/></svg>`)}`;
const image = ref(svg(20));
const updated = ref(false);
const loads = ref(0);
const bubbles = ref(0);
const errors = ref(0);
const layouts = ref(0);
const clicks = ref(0);
const items = [0, 1, 2].map(index => ({ key: String(index), data: index }));
const showSlot = ref(false);
const emptySlot = ref(false);
const rows = ref([{ key: 'a', data: { title: 'Alpha' }, children: 'fallback' }, { key: 'b', data: { title: 'Beta' }, children: 'fallback' }]);
const replaceRows = () => { rows.value = [...rows.value].reverse().map(row => ({ ...row, data: { title: row.data.title + '!' } })); };
const reset = () => { loads.value = bubbles.value = errors.value = layouts.value = clicks.value = 0; };
</script>

<template>
  <button @click="image = svg(140)">Load taller image</button>
  <button @click="updated = !updated">Update masonry attrs</button>
  <button @click="reset">Reset masonry counters</button>
  <Masonry data-native-masonry :id="updated ? 'masonry-new' : 'masonry-native'"
    :class="updated ? ['second', { active: true }] : 'first'"
    :style="updated ? 'width:320px;color:blue' : 'width:320px;color:red'"
    :items="items" :columns="2" :fresh="false"
    @load.capture="loads++" @load="bubbles++" @error.capture="errors++"
    @layout-change="layouts++" @click="clicks++">
    <template #item="{ index }">
      <div v-if="index === 0">
        <img :src="image" alt="Dynamic tile" style="width: 100%; display: block" />
        <input aria-label="Masonry input" style="height: 20px; width: 100%; display: block; box-sizing: border-box" />
      </div>
      <div v-else :style="{ height: index === 1 ? '60px' : '20px' }">Tile {{ index }}</div>
    </template>
  </Masonry>
  <button @click="showSlot = !showSlot">Toggle item slot</button>
  <button @click="emptySlot = !emptySlot">Toggle empty slot</button>
  <button @click="replaceRows">Replace same keys</button>
  <Masonry data-slot-masonry :items="rows" :columns="2" style="width: 320px">
    <template v-if="showSlot" #item="{ data, key, index, column }">
      <div v-if="!emptySlot" style="height: 80px">
        <b>{{ data.title.toUpperCase() }}:{{ index }}:{{ column }}</b>
        <input :aria-label="`Slot ${key}`" />
      </div>
    </template>
  </Masonry>
  <output id="masonry-native-state">{{ JSON.stringify({ loads, bubbles, errors, layouts, clicks }) }}</output>
</template>
