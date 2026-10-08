const t=`<script setup lang="ts">
// 对齐 antd demo/style-class.tsx —— 用 classNames / styles 自定义语义化结构样式
// ⚠️ 本仓只支持**对象形态**（函数式语义槽 PENDING，D36 同判）

import type { NotificationArgsProps } from '@apollo-design/ui';
import { Button, notification, Space } from '@apollo-design/ui';

const defaultStyles: NonNullable<NotificationArgsProps['styles']> = {
  root: {
    backgroundColor: '#f6ffed',
    border: '2px solid #95de64',
    borderRadius: 16,
    boxShadow: '4px 4px 0 #d9f7be',
  },
  icon: { color: '#237804' },
  title: { color: '#237804', fontWeight: 600 },
};

const [api, contextHolder] = notification.useNotification();

const showObjectStyle = () => {
  api.open({
    title: 'This is a notification with object styles',
    description: 'The semantic slots can be styled with classNames and styles',
    styles: defaultStyles,
  });
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button @click="showObjectStyle">Object style</Button>
  </Space>
</template>
`;export{t as default};
