const n=`<script setup lang="ts">
// 对齐 antd demo/static-info.tsx
import { Button, Modal, Space } from '@apollo-design/ui';

const info = () => {
  Modal.info({
    title: 'This is a notification message',
    content: 'some messages...some messages...',
    onOk() {},
  });
};

const success = () => {
  Modal.success({ content: 'some messages...some messages...' });
};

const error = () => {
  Modal.error({
    title: 'This is an error message',
    content: 'some messages...some messages...',
  });
};

const warning = () => {
  Modal.warning({
    title: 'This is a warning message',
    content: 'some messages...some messages...',
  });
};
<\/script>

<template>
  <Space wrap>
    <Button @click="info">Info</Button>
    <Button @click="success">Success</Button>
    <Button @click="error">Error</Button>
    <Button @click="warning">Warning</Button>
  </Space>
</template>
`;export{n as default};
