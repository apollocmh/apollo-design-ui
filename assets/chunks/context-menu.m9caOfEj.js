const n=`<script setup lang="ts">
// 对齐 antd demo/context-menu.tsx
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
<\/script>

<template>
  <Dropdown :menu="{ items }" :trigger="['contextMenu']">
    <div style="padding: 40px; border: 1px dashed #d9d9d9; text-align: center; user-select: none">
      Right Click on here
    </div>
  </Dropdown>
</template>
`;export{n as default};
