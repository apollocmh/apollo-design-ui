<script setup lang="ts">
// 对齐 antd 的 custom demo。
// ⚠️ demo 替换登记：antd 用 Avatar（P5 未落地）—— 按仓库约定用等价原生结构替换。
import { Segmented } from '@apollo-design/ui';

const users = [
  { label: 'User 1', value: 'user1', tooltip: { title: 'hello user1', color: 'gold' } },
  { label: 'User 2', value: 'user2', tooltip: { title: 'hello user2', color: 'pink' } },
  { label: 'User 3', value: 'user3', tooltip: { title: 'hello user3', color: 'geekblue' } },
];

const seasons = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Autumn', value: 'autumn' },
  { label: 'Winter', value: 'winter' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Segmented :options="users" />
    <Segmented :options="seasons" />
  </div>
</template>
