<script setup lang="ts">
// 对齐 antd 的 style-class demo（antd 的 createStaticStyles 直接换成对象/函数两态）

import type { AlertSemanticStyles } from '@apollo-design/ui';
import { Alert, Button } from '@apollo-design/ui';

const classNames = { root: 'demo-alert-root' };

const styleFn = ({ props }: { props: { type?: string } }): AlertSemanticStyles => {
  if (props.type === 'success') {
    return {
      root: {
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        borderColor: '#b7eb8f',
      },
      icon: { color: '#52c41a' },
    };
  }
  if (props.type === 'warning') {
    return {
      root: {
        backgroundColor: 'rgba(250, 173, 20, 0.1)',
        borderColor: '#ffe58f',
      },
      icon: { color: '#faad14' },
    };
  }
  return {};
};
</script>

<template>
  <div class="demo-alert-style-list">
    <Alert
      show-icon
      :class-names="classNames"
      title="Object styles"
      type="info"
      :styles="{ icon: { fontSize: '18px' }, section: { fontWeight: 500 } }"
    >
      <template #action>
        <Button size="small">Action</Button>
      </template>
    </Alert>
    <Alert
      show-icon
      :class-names="classNames"
      title="Function styles"
      type="success"
      :styles="styleFn"
    />
  </div>
</template>

<style scoped>
.demo-alert-style-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

<style>
.demo-alert-root {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 12px;
}
</style>
