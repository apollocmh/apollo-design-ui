<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx
import { Mentions } from '@apollo-design/ui';

const InternalMentions = Mentions._InternalPanelDoNotUseOrYouWillBeFired;

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
];
</script>

<template>
  <InternalMentions style="width: 100%" value="@" :options="options" />
</template>
