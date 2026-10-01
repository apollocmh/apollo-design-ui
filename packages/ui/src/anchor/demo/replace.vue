<script setup lang="ts">
// 对齐 antd 的 replace demo：用 `replaceState` 而不是 `pushState`。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
];
</script>

<template>
  <Anchor replace :items="items" :affix="false" />
</template>
