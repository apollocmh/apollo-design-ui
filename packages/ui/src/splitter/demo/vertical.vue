<script setup lang="ts">
// 对齐 antd 的 vertical demo
import { Splitter } from '@apollo-design/ui';
</script>

<template>
  <Splitter orientation="vertical" style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9">
    <Splitter.Panel>Top</Splitter.Panel>
    <Splitter.Panel>Bottom</Splitter.Panel>
  </Splitter>
</template>
