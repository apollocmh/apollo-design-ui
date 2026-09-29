<script setup lang="ts">
// 对齐 antd `icon.tsx`。⚠️ 图标用 `h(Icon)` 生成 VNode（`items[].icon` 的类型是 `VNodeChild`）；
//    `icon` 与**字符串** label 同时存在时，label 会被包一层 `<span>`（上游同款）。
import { AndroidOutlined, AppleOutlined } from '@apollo-design/icons';
import { Tabs } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { key: '1', label: 'Tab 1', icon: h(AppleOutlined), children: 'Tab 1' },
  { key: '2', label: 'Tab 2', icon: h(AndroidOutlined), children: 'Tab 2' },
];
</script>

<template>
  <Tabs default-active-key="1" :items="items" />
</template>
