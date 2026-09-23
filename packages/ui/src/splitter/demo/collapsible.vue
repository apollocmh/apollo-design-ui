<script setup lang="ts">
// 对齐 antd 的 collapsible demo
import { Splitter } from '@apollo-design/ui';
</script>

<template>
  <Splitter style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9">
    <Splitter.Panel collapsible min="20%" default-size="40%">Left</Splitter.Panel>
    <Splitter.Panel collapsible>Right</Splitter.Panel>
  </Splitter>
</template>
