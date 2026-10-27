<script setup lang="ts">
import { LinkedinOutlined, TwitterOutlined, YoutubeOutlined } from '@apollo-design/icons';
import { CheckableTag } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref([true, false, false]);
const icons = [TwitterOutlined, YoutubeOutlined, LinkedinOutlined];
const colors = ['geekblue', 'green', 'purple'];
</script>

<template>
    <CheckableTag v-for="(item, i) in icons" :key="i" :style="{ marginInlineEnd: '8px' }" v-model:checked="checked[i]">
      <template #icon><component :is="item" aria-hidden="true" /></template>
      {{ colors[i] }}
    </CheckableTag>
</template>
