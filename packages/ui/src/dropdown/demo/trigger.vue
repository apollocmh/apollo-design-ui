<script setup lang="ts">
// 对齐 antd demo/trigger.tsx
import { DownOutlined } from '@apollo-design/icons';
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Dropdown :menu="{ items }" :trigger="['click']">
      <a class="cursor-pointer" @click.prevent>
        Click me
        <DownOutlined />
      </a>
    </Dropdown>
    <Dropdown :menu="{ items }" :trigger="['contextMenu']">
      <div style="padding: 24px; border: 1px dashed #d9d9d9; user-select: none">
        Right Click on here
      </div>
    </Dropdown>
  </div>
</template>
