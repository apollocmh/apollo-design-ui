const t=`<script setup lang="ts">
// 对齐 antd demo/arrow.tsx
import { Button, Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];

const placements = ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'] as const;
<\/script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; height: 200px; align-content: center">
    <Dropdown v-for="p in placements" :key="p" :menu="{ items }" :placement="p" arrow>
      <Button>{{ p }}</Button>
    </Dropdown>
  </div>
</template>
`;export{t as default};
