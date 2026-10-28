<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const items: VNodeChild[] = [
  'Button',
  h(Button, null, () => 'Button'),
  'Button',
  h(Button, null, () => 'Delete'),
  h(Button, { disabled: true }, () => 'Delete'),
  null,
  false,
  0,
  'Button',
  null,
  undefined,
];
const Demo = () => h(Space, null, { default: () => items });
</script>
<template><component :is="Demo" /></template>
