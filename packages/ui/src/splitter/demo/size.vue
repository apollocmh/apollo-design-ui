<script setup lang="ts">
// 对齐 antd 的 size demo：defaultSize 支持百分比 / 像素，min / max 限制拖拽范围
import { Splitter } from '@apollo-design/ui';
import { ref } from 'vue';

const sizes = ref<number[]>([]);

const onResize = (next: number[]) => {
  sizes.value = next;
};
</script>

<template>
  <Splitter style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9" @resize="onResize">
    <Splitter.Panel default-size="30%" min="20%" max="50%">30% / min 20% / max 50%</Splitter.Panel>
    <Splitter.Panel default-size="200px" min="100px" max="300px">200px 初始宽度</Splitter.Panel>
    <Splitter.Panel>剩余空间</Splitter.Panel>
  </Splitter>
  <p>
    当前面板尺寸（px）：{{ sizes.map((size) => Math.round(size)).join(' / ') || '拖动分隔条查看' }}
  </p>
</template>
