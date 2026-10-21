<script setup lang="ts">
// 对齐 antd 的 `custom` demo：通过 optionRender 插槽自定义选项内容。
import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Tag, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const options: DefaultOptionType[] = [
  { value: 'antd', label: 'Ant Design', category: 'React' },
  { value: 'apollo', label: 'Apollo Design', category: 'Vue' },
  { value: 'vue', label: 'Vue 3', category: 'Framework' },
];
</script>

<template>
  <div>
    <AutoComplete aria-label="自动补全输入框"
      v-model:value="value"
      :options="options"
      :filter-option="true"
      style="width: 280px"
      placeholder="输入以筛选"
    >
      <template #optionRender="{ option }">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px">
          <span>{{ option.label }}</span>
          <Tag color="blue">{{ option.data.category }}</Tag>
        </div>
      </template>
    </AutoComplete>
    <div style="margin-top: 8px"><Text type="secondary">当前值：{{ value || '（空）' }}</Text></div>
  </div>
</template>
