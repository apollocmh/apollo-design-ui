<script setup lang="ts">
// 对齐 antd demo/custom-dropdown.tsx（popupRender 自定义内容）
import { Dropdown } from '@apollo-design/ui';
import { h } from 'vue';

const renderOverlay = () =>
  h('div', { style: { padding: '8px', width: '200px' } }, 'This is a custom dropdown content.');
</script>

<template>
  <Dropdown :popup-render="renderOverlay">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
