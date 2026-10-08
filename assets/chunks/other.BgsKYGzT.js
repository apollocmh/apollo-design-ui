const n=`<script setup lang="ts">
// 对齐 antd demo/other.tsx —— success / error / warning 三种类型
import { Button, message, Space } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();

const success = () => {
  messageApi.open({ type: 'success', content: 'This is a success message' });
};
const error = () => {
  messageApi.open({ type: 'error', content: 'This is an error message' });
};
const warning = () => {
  messageApi.open({ type: 'warning', content: 'This is a warning message' });
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button @click="success">Success</Button>
    <Button @click="error">Error</Button>
    <Button @click="warning">Warning</Button>
  </Space>
</template>
`;export{n as default};
