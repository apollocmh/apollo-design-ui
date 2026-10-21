<script setup lang="ts">
// 对齐 antd 的 group demo：Splitter 嵌套组合
import { Splitter } from '@apollo-design/ui';
</script>

<template>
  <Splitter style="height: 300px; box-shadow: 0 0 0 1px #d9d9d9">
    <Splitter.Panel default-size="40%">
      <Splitter vertical style="height: 100%">
        <Splitter.Panel default-size="50%">左上</Splitter.Panel>
        <Splitter.Panel default-size="50%">左下</Splitter.Panel>
      </Splitter>
    </Splitter.Panel>
    <Splitter.Panel>
      <Splitter vertical style="height: 100%">
        <Splitter.Panel default-size="50%">右上</Splitter.Panel>
        <Splitter.Panel default-size="50%">右下</Splitter.Panel>
      </Splitter>
    </Splitter.Panel>
  </Splitter>
</template>
