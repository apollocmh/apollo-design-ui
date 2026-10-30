<script setup lang="ts">
import { ref } from 'vue';
import type { MasonryLayoutItem } from '../../interface';
import Masonry from '../../Masonry.vue';

defineProps<{ items: { key: string; data: number }[] }>();
const calls = ref(0);
const onLayout = (_items: MasonryLayoutItem<number>[]): void => {
  calls.value += 1;
};
</script>

<template>
  <Masonry :items="items" :columns="2" @layout-change.once="onLayout">
    <template #item="{ data }"><div :style="{ height: `${data}px` }">{{ data }}</div></template>
  </Masonry>
  <output>{{ calls }}</output>
</template>
