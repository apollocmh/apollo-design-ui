<script setup lang="ts">
// 对齐 antd demo/custom-dropdown-menu.tsx（popupRender 追加内容）
import { Button, Select } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
const popupRender = (menu: unknown): VNodeChild =>
  h('div', {}, [
    menu as VNodeChild,
    h('div', { style: 'padding: 8px' }, [h(Button, {}, () => 'more')]),
  ]);
</script>

<template>
  <Select :options="options" :popup-render="popupRender" style="width: 200px" />
</template>
