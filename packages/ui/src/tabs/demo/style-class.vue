<script setup lang="ts">
// 语义化样式与类：root / header / item / indicator / content
import type { TabsProps } from '@apollo-design/ui';
import { Tabs } from '@apollo-design/ui';

const classNames: TabsProps['classNames'] = {
  root: 'demo-tabs-style',
  header: 'demo-tabs-style__header',
  item: 'demo-tabs-style__item',
  indicator: 'demo-tabs-style__indicator',
  content: 'demo-tabs-style__content',
};

const styles: TabsProps['styles'] = {
  header: { backgroundColor: '#f9f0ff', paddingInline: '12px', borderRadius: '8px 8px 0 0' },
  item: { letterSpacing: '0.4px' },
  indicator: { backgroundColor: '#722ed1' },
  content: { backgroundColor: '#fcfaff', padding: '16px', borderRadius: '0 0 8px 8px' },
};

const items = [
  { key: '1', label: '设计', children: '设计面板：组件规范与视觉基线。' },
  { key: '2', label: '开发', children: '开发面板：API 文档与示例代码。' },
  { key: '3', label: '测试', children: '测试面板：单元、DOM 契约与可访问性报告。' },
];
</script>

<template>
  <Tabs
    default-active-key="1"
    :items="items"
    :class-names="classNames"
    :styles="styles"
  />
</template>

<style>
.demo-tabs-style__item {
  font-weight: 500;
}

.demo-tabs-style__indicator {
  height: 3px;
}
</style>
