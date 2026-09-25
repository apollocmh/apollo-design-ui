<script setup lang="ts">
// 对齐 antd demo/basic.tsx
import { DownOutlined, SmileOutlined } from '@apollo-design/icons';
import { Dropdown } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item (disabled)', icon: h(SmileOutlined), disabled: true },
  { key: '3', label: '3rd menu item' },
];
</script>

<template>
  <Dropdown :menu="{ items }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
      <DownOutlined />
    </a>
  </Dropdown>
</template>
