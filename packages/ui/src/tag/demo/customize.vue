<script setup lang="ts">
import {
  FacebookOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  YoutubeOutlined,
} from '@apollo-design/icons';
import { Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref([true, false, false, false]);
const icons = [TwitterOutlined, YoutubeOutlined, FacebookOutlined, LinkedinOutlined];
const colors = ['magenta', 'volcano', 'orange', 'gold'];

const toggle = (i: number) => {
  checked.value = checked.value.map((c, idx) => (idx === i ? !c : c));
};
</script>

<template>
  <button v-for="(item, i) in icons" :key="i" type="button" class="demo-tag-toggle" :aria-pressed="checked[i]" @click="toggle(i)">
    <Tag :color="checked[i] ? colors[i] : undefined">
      <template #icon><component :is="item" aria-hidden="true" /></template>
      {{ colors[i] }}
    </Tag>
  </button>
</template>
<style scoped>
.demo-tag-toggle { margin-inline-end: 8px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.demo-tag-toggle:focus-visible { outline: 2px solid var(--apollo-color-primary); outline-offset: 2px; }
</style>
