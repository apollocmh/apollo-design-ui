<script setup lang="ts">
// 对齐 antd 的 customize demo

import {
  FacebookOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  YoutubeOutlined,
} from '@apollo-design/icons';
import { Tag } from '@apollo-design/ui';
import { h, ref } from 'vue';

const checked = ref([true, false, false, false]);
const icons = [TwitterOutlined, YoutubeOutlined, FacebookOutlined, LinkedinOutlined];
const colors = ['magenta', 'volcano', 'orange', 'gold'];

const toggle = (i: number) => {
  checked.value = checked.value.map((c, idx) => (idx === i ? !c : c));
};
</script>

<template>
  <span v-for="(item, i) in icons" :key="i" :style="{ marginRight: '8px' }" @click="toggle(i)">
    <Tag :color="checked[i] ? colors[i] : undefined">
      <component :is="h(item)" />
      {{ colors[i] }}
    </Tag>
  </span>
</template>
