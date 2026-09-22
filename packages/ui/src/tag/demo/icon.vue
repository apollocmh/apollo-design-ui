<script setup lang="ts">
// 对齐 antd 的 icon demo

import { LinkedinOutlined, TwitterOutlined, YoutubeOutlined } from '@apollo-design/icons';
import { CheckableTag, Tag } from '@apollo-design/ui';
import { h, ref } from 'vue';

const checked = ref([true, false, false]);
const icons = [TwitterOutlined, YoutubeOutlined, LinkedinOutlined];
const colors = ['geekblue', 'green', 'purple'];

const toggle = (i: number) => {
  checked.value = checked.value.map((c, idx) => (idx === i ? !c : c));
};
</script>

<template>
  <span v-for="(item, i) in icons" :key="i" :style="{ marginRight: '8px' }" @click="toggle(i)">
    <CheckableTag :checked="checked[i]">
      <component :is="h(item)" />
      {{ colors[i] }}
    </CheckableTag>
  </span>
</template>
