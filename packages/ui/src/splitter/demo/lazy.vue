<script setup lang="ts">
// 对齐 antd 的 lazy demo：拖动只预览，松手才应用
import { Splitter } from '@apollo-design/ui';
import { ref } from 'vue';

const result = ref('尚未拖动');

const onResizeEnd = (sizes: number[]) => {
  result.value = sizes.map((size) => `${Math.round(size)}px`).join(' / ');
};
</script>

<template>
  <p>开启 `lazy` 后，拖动时只显示预览线，松手才更新面板尺寸。</p>
  <Splitter lazy style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9" @resize-end="onResizeEnd">
    <Splitter.Panel>左侧</Splitter.Panel>
    <Splitter.Panel>右侧</Splitter.Panel>
  </Splitter>
  <p>松手后的尺寸：{{ result }}</p>
</template>
