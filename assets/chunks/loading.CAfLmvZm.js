const n=`<script setup lang="ts">
// 对齐 antd demo/loading.tsx —— 全局 loading，异步自行移除（duration: 0 不自动关）
import { Button, message } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();

const success = () => {
  messageApi.open({
    type: 'loading',
    content: 'Action in progress..',
    duration: 0,
  });
  // 手动异步移除
  setTimeout(messageApi.destroy, 2500);
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button @click="success">Display a loading indicator</Button>
</template>
`;export{n as default};
