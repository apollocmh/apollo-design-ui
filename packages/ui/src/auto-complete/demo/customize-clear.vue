<script setup lang="ts">
// 对齐 antd 的 `customize-clear` demo：自定义 clearIcon 并反馈清空次数。
import { CloseCircleFilled } from '@apollo-design/icons';
import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('Ant Design');
const cleared = ref(0);
const options: DefaultOptionType[] = [
  { value: 'Ant Design' },
  { value: 'Apollo Design' },
  { value: 'Vue 3' },
];

const onClear = () => {
  cleared.value += 1;
};
</script>

<template>
  <div>
    <AutoComplete aria-label="自动补全输入框"
      v-model:value="value"
      :options="options"
      allow-clear
      style="width: 280px"
      :on-clear="onClear"
    >
      <template #clearIcon><CloseCircleFilled style="color: #1677ff" /></template>
    </AutoComplete>
    <div style="margin-top: 8px">
      <Text type="secondary">已清空 {{ cleared }} 次；当前值：{{ value || '（空）' }}</Text>
    </div>
  </div>
</template>
