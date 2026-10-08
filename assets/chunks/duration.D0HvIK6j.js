const s=`<script setup lang="ts">
// 对齐 antd demo/duration.tsx —— 自定义时长 10s（默认 3s）
import { Button, message } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();

const success = () => {
  messageApi.open({
    type: 'success',
    content: 'This is a prompt message for success, and it will disappear in 10 seconds',
    duration: 10,
  });
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button @click="success">Customized display duration</Button>
</template>
`;export{s as default};
