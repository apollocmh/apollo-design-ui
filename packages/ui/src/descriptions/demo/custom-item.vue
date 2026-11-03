<script setup lang="ts">
// 原生 Item 插槽与样式；切换布局仍保留内容实例。
import { Button, Descriptions, DescriptionsItem, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const vertical = ref(false);
</script>

<template>
  <Descriptions title="Styles & span" :layout="vertical ? 'vertical' : 'horizontal'">
    <template #extra><Button size="small" @click="vertical = !vertical">切换布局</Button></template>
    <DescriptionsItem label="Styles" :styles="{ content: { fontWeight: 600 } }">
      <template #label><strong>原生</strong>标签</template>
      <Input aria-label="保留的草稿" default-value="切换布局后仍保留草稿" style="max-width: 100%" />
    </DescriptionsItem>
    <DescriptionsItem label="Span" :span="2">占两列</DescriptionsItem>
    <DescriptionsItem label="Filled" span="filled">填满本行剩余列位</DescriptionsItem>
  </Descriptions>
</template>
