const n=`<script setup lang="ts">
// 对齐 antd demo/placement.tsx（12 方向网格）
import { Button, Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];

const placements = ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'] as const;

const grid: Array<Array<(typeof placements)[number] | ''>> = [
  ['', placements[0], placements[1], placements[2], ''],
  [placements[3], '', '', '', placements[4]],
  [placements[5], '', '', '', ''],
];
void grid;
<\/script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; height: 200px; align-content: center">
    <Dropdown v-for="p in placements" :key="p" :menu="{ items }" :placement="p">
      <Button>{{ p }}</Button>
    </Dropdown>
  </div>
</template>
`;export{n as default};
