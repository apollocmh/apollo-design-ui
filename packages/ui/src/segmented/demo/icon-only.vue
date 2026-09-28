<script setup lang="ts">
// 对齐 antd 的 icon-only demo

import { AppstoreOutlined, BarsOutlined } from '@apollo-design/icons';
import { Segmented } from '@apollo-design/ui';
import { h } from 'vue';

const options = [
  { value: 'List', icon: h(BarsOutlined) },
  { value: 'Kanban', icon: h(AppstoreOutlined) },
];
</script>

<template>
  <Segmented :options="options" />
</template>
