const e=`<script setup lang="ts">
// 对齐 antd demo/thenable.tsx —— 用 then 串联消息（关闭后 resolve true）
import { Button, message } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();

const success = () => {
  messageApi
    .open({ type: 'loading', content: 'Action in progress..', duration: 2.5 })
    .then(() => message.success('Loading finished', 2.5))
    .then(() => message.info('Loading finished', 2.5));
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button @click="success">Display sequential messages</Button>
</template>
`;export{e as default};
