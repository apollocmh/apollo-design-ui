<script setup lang="ts">
// 对齐 antd 的 basic demo
import { Splitter } from '@apollo-design/ui';
</script>

<template>
  <Splitter style="height: 200px; box-shadow: 0 0 0 1px var(--apollo-color-border)">
    <Splitter.Panel>Left</Splitter.Panel>
    <Splitter.Panel>Right</Splitter.Panel>
  </Splitter>
</template>
