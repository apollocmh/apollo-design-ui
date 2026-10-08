const e=`<script setup lang="ts">
// 对齐 antd demo/update.tsx —— 同 key 复用同一条 notice（更新内容）
import { Button, message } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();
const key = 'updatable';

const openMessage = () => {
  messageApi.open({ key, type: 'loading', content: 'Loading...' });
  setTimeout(() => {
    messageApi.open({ key, type: 'success', content: 'Loaded!', duration: 2 });
  }, 1000);
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openMessage">Open the message box</Button>
</template>
`;export{e as default};
