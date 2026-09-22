<script setup lang="ts">
// 对齐 antd 的 style-class demo（createStaticStyles 未落地 —— 内联对象等价）
import { Tag } from '@apollo-design/ui';

const classNames = {
  root: 'demo-tag-root',
  icon: 'demo-tag-icon',
};
const styles = {
  root: { padding: '2px 6px', borderRadius: '4px' },
};
</script>

<template>
  <Tag
    :class-names="classNames"
    :styles="styles"
    closable
  >
    Tag with semantic slots
  </Tag>
</template>

<style>
.demo-tag-root {
  border-color: #2db7f5;
}
</style>
