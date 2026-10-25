<script setup lang="ts">
import { ref } from 'vue';
import { Image, ImagePreviewGroup } from '../../../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactBoolean = <T>(value: T, ..._check: Equal<T, boolean> extends true ? [] : [never]) =>
  value;
const exactNumber = <T>(value: T, ..._check: Equal<T, number> extends true ? [] : [never]) => value;
const imageOpen = ref(false);
const groupOpen = ref(false);
const current = ref(0);
const imageChanges = ref<Array<[boolean, boolean]>>([]);
const groupOpenChanges = ref<Array<[boolean, boolean]>>([]);
const groupChanges = ref<Array<[number, number]>>([]);
const groupUpdates = ref<number[]>([]);
const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#38598b"/></svg>')}`;
</script>

<template>
  <section>
    <button data-open-image-model @click="imageOpen = true">Open image model</button>
    <button data-close-image-model @click="imageOpen = false">Close image model</button>
    <button data-open-group-model @click="groupOpen = true">Open group model</button>
    <button data-close-group-model @click="groupOpen = false">Close group model</button>
    <Image
      data-state-model-image :src="src" alt="Image model preview" v-model:open="imageOpen"
      @open-change="(next, previous) => imageChanges.push([exactBoolean(next), exactBoolean(previous)])"
    />
    <ImagePreviewGroup
      data-state-model-group v-model:open="groupOpen" v-model:current="current"
      @open-change="(next, previous) => groupOpenChanges.push([exactBoolean(next), exactBoolean(previous)])"
      @change="(next, previous) => groupChanges.push([exactNumber(next), exactNumber(previous)])"
      @update:current="value => groupUpdates.push(exactNumber(value))"
    >
      <Image data-state-model-first :src="src" alt="Group model first" />
      <Image data-state-model-second :src="src" alt="Group model second" />
    </ImagePreviewGroup>
    <output data-image-model-value>{{ imageOpen }}</output>
    <output data-group-model-value>{{ groupOpen }}</output>
    <output data-group-current-value>{{ current }}</output>
    <output data-image-model-changes>{{ JSON.stringify(imageChanges) }}</output>
    <output data-group-open-changes>{{ JSON.stringify(groupOpenChanges) }}</output>
    <output data-group-model-changes>{{ JSON.stringify(groupChanges) }}</output>
    <output data-group-model-updates>{{ JSON.stringify(groupUpdates) }}</output>
  </section>
</template>
