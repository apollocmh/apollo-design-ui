<script setup lang="ts">
// 对齐 antd demo/allowClear.tsx
import { AutoComplete, Space } from '@apollo-design/ui';
</script>

<template>
  <Space vertical style="width: 100%">
    <AutoComplete aria-label="自动补全输入框"
      :options="[{ value: 'text' }]"
      placeholder="allowClear"
      style="width: 200px"
      allow-clear
    />
    <AutoComplete aria-label="自动补全输入框"
      :options="[{ value: 'text' }]"
      placeholder="clearIcon"
      style="width: 200px"
      allow-clear
      #clearIcon
    >
      <span>⨯</span>
    </AutoComplete>
  </Space>
</template>
