const o=`<script setup lang="ts">
// 对齐 antd demo/progress-color.tsx —— 进度条配色
// ⚠️ antd 用 ConfigProvider 的 theme.components.Notification.progressBg 覆盖；本仓的
//    组件级 token 覆盖尚未落地（D25/D83 同判）⇒ 以**默认**进度条配色渲染。
import { Button, notification } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();

const openNotification = () => {
  api.open({
    title: 'Customize progress bar color',
    description: 'You can use component token to customize the progress bar color',
    showProgress: true,
    duration: 20,
  });
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openNotification">Show custom progress color</Button>
</template>
`;export{o as default};
