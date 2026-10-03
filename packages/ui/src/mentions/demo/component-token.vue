<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
import { ConfigProvider, Mentions } from '@apollo-design/ui';

const InternalMentions = Mentions._InternalPanelDoNotUseOrYouWillBeFired;

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
];

const theme = {
  components: {
    Mentions: { dropdownHeight: 500, controlItemWidth: 300, zIndexPopup: 1000 },
  },
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <InternalMentions style="width: 100%" value="@" :options="options" />
  </ConfigProvider>
</template>
