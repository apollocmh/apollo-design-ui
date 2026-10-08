const e=`<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx（PurePanel 静态面板）
import { DropdownPurePanel } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item', danger: true },
  { key: '3', label: '3rd menu item', disabled: true },
];
<\/script>

<template>
  <div style="margin: 24px">
    <DropdownPurePanel :menu="{ items }" />
  </div>
</template>
`;export{e as default};
