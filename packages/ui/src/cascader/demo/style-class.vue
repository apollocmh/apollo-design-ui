<script setup lang="ts">
// 对齐 antd 的 style-class demo：classNames / styles 语义槽
import { Cascader, Switch, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const emphasize = ref(true);
const value = ref<string[]>([]);

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

const classNames = computed<Record<string, unknown>>(() => ({
  root: 'cascader-style-class-root',
  suffix: 'cascader-style-class-suffix',
  content: 'cascader-style-class-content',
  placeholder: 'cascader-style-class-placeholder',
  popup: {
    root: 'cascader-style-class-popup',
    list: 'cascader-style-class-list',
    listItem: 'cascader-style-class-list-item',
  },
}));

const styles = computed<Record<string, unknown>>(() => ({
  root: {
    borderRadius: emphasize.value ? '14px' : '8px',
    borderColor: emphasize.value ? '#95de64' : '#d9d9d9',
    background: emphasize.value ? '#f6ffed' : '#ffffff',
  },
  suffix: {
    color: emphasize.value ? '#389e0d' : '#8c8c8c',
  },
  content: {
    fontWeight: emphasize.value ? '600' : '400',
    color: emphasize.value ? '#135200' : '#1f1f1f',
  },
  popup: {
    list: {
      backgroundColor: emphasize.value ? '#f6ffed' : '#ffffff',
      padding: '6px',
    },
    listItem: {
      borderRadius: '8px',
    },
  },
}));
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <Switch v-model:checked="emphasize" aria-label="启用强调样式" />
      <span>强调样式</span>
      <Tag color="green">{{ emphasize ? '强调' : '素雅' }}</Tag>
    </div>

    <Cascader
      v-model:value="value"
      :options="options"
      :class-names="classNames"
      :styles="styles"
      placeholder="选择地区（语义样式）"
    />
  </div>
</template>

<style>
.cascader-style-class-popup {
  border: 1px solid #b7eb8f;
}

.cascader-style-class-list {
  min-width: 132px;
}

.cascader-style-class-list-item {
  margin: 2px 0;
  transition: background-color 0.2s ease;
}

.cascader-style-class-root {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
</style>
