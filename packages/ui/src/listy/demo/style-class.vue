<script setup lang="ts">
// 对齐 antd 的 `style-class` 用法：Listy 的 root / item / groupHeader 语义槽。
import type { ListyClassNames, ListyStyles } from '@apollo-design/ui';
import { Listy, Switch, Text } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const highlight = ref(true);

const items = Array.from({ length: 8 }, (_, i) => ({ key: i, content: `Item ${i + 1}` }));

const classNames: ListyClassNames = {
  root: 'demo-listy-style-root',
  item: 'demo-listy-style-item',
};

const styles = computed<ListyStyles>(() =>
  highlight.value ? { item: { background: '#e6f4ff', borderRadius: '6px' } } : {},
);
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
      <Text>高亮 item 语义槽</Text>
      <Switch v-model:checked="highlight" aria-label="高亮语义槽" />
    </div>
    <Listy :items="items" row-key="key" :class-names="classNames" :styles="styles" :height="240">
      <template #default="{ item }">{{ item.content }}</template>
    </Listy>
  </div>
</template>

<style>
.demo-listy-style-root {
  padding: 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.demo-listy-style-item {
  padding: 4px 8px;
}
</style>
