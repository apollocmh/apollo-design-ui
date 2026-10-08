const e=`<script setup lang="ts">
// 对齐 antd demo/hooks.tsx —— 推荐形态：useMessage() 的 contextHolder 能消费 context
import { Button, message } from '@apollo-design/ui';

const [messageApi, contextHolder] = message.useMessage();

const info = () => {
  messageApi.info('Hello, Apollo Design!');
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="info">Display normal message</Button>
</template>
`;export{e as default};
