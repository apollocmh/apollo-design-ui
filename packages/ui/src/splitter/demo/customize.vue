<script setup lang="ts">
// 对齐 antd 的 customize demo：自定义拖拽手柄 + 面板样式
import { HolderOutlined } from '@apollo-design/icons';
import { Splitter } from '@apollo-design/ui';
import { ref } from 'vue';

const sizeText = ref('拖动分隔条查看尺寸');

const onResizeEnd = (sizes: number[]) => {
  sizeText.value = sizes.map((size) => `${Math.round(size)}px`).join(' / ');
};
</script>

<template>
  <Splitter
    style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9"
    @resize-end="onResizeEnd"
  >
    <Splitter.Panel class="demo-splitter-panel-a" default-size="50%">自定义拖拽手柄</Splitter.Panel>
    <Splitter.Panel class="demo-splitter-panel-b" default-size="50%">右侧面板</Splitter.Panel>
    <template #draggerIcon>
      <HolderOutlined />
    </template>
  </Splitter>
  <p>松手后的尺寸：{{ sizeText }}</p>
</template>

<style scoped>
.demo-splitter-panel-a {
  padding: 12px;
  background: #e6f4ff;
}

.demo-splitter-panel-b {
  padding: 12px;
  background: #f6ffed;
}
</style>
