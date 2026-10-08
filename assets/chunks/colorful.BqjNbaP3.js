const n=`<script setup lang="ts">
// 对齐 antd 的 colorful demo
import { Badge } from '@apollo-design/ui';

const colors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
] as const;
<\/script>

<template>
  <Badge v-for="c in colors" :key="c" :color="c" :text="c" />
</template>
`;export{n as default};
