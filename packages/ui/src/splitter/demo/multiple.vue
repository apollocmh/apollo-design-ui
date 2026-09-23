<script setup lang="ts">
// 对齐 antd 的 multiple demo（多面板 + min/max）
import { Splitter } from '@apollo-design/ui';
</script>

<template>
  <Splitter style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9">
    <Splitter.Panel collapsible default-size="20%" min="10%">Left</Splitter.Panel>
    <Splitter.Panel default-size="40%">Center</Splitter.Panel>
    <Splitter.Panel max="60%" collapsible>Right</Splitter.Panel>
  </Splitter>
</template>
