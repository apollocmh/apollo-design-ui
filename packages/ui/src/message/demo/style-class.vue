<script setup lang="ts">
// 对齐 antd demo/style-class.tsx —— 用 classNames / styles 自定义语义化结构样式
// ⚠️ 本仓只支持**对象形态**（函数式语义槽 PENDING，D36 同判）⇒ 只演示对象形态

import type { MessageArgsProps } from '@apollo-design/ui';
import { Button, message, Space } from '@apollo-design/ui';

const defaultStyles: NonNullable<MessageArgsProps['styles']> = {
  root: {
    backgroundColor: '#f6ffed',
    border: '2px solid #95de64',
    borderRadius: 16,
    boxShadow: '4px 4px 0 #d9f7be',
  },
  icon: { color: '#237804' },
  title: { color: '#237804', fontWeight: 600 },
};

const errorStyles: NonNullable<MessageArgsProps['styles']> = {
  root: {
    backgroundColor: '#fff2f0',
    border: '2px solid #ffccc7',
    borderRadius: 16,
    boxShadow: '4px 4px 0 #ffccc7',
  },
  icon: { color: '#cf1322' },
  title: { color: '#cf1322', fontWeight: 600 },
};

const [messageApi, contextHolder] = message.useMessage();

const showObjectStyle = () => {
  messageApi.open({
    type: 'success',
    content: 'This is a message with object styles',
    styles: defaultStyles,
  });
};

const showErrorStyle = () => {
  messageApi.open({
    type: 'error',
    content: 'This is a message with error styles',
    styles: errorStyles,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button @click="showObjectStyle">Object style</Button>
    <Button type="primary" @click="showErrorStyle">Error style</Button>
  </Space>
</template>
