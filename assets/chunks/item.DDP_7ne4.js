const e=`<script setup lang="ts">
// 对齐 antd demo/item.tsx
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '0', label: '1st menu item' },
  { key: '1', label: '2nd menu item' },
  { key: '3', label: '3rd menu item', disabled: true },
];
<\/script>

<template>
  <Dropdown :menu="{ items }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
`;export{e as default};
