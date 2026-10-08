const n=`<script setup lang="ts">
// 对齐 antd demo/async.tsx：onOk 返回 Promise ⇒ 按钮自动进入 loading
import { Button, Modal } from '@apollo-design/ui';

const handleOk = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 1000);
  });

const showAsync = () => {
  Modal.confirm({
    title: 'Do you want to delete these items?',
    content: 'When clicked the OK button, this dialog will be closed after 1 second',
    onOk: () => handleOk(),
  });
};
<\/script>

<template>
  <Button @click="showAsync">Open modal with async logic</Button>
</template>
`;export{n as default};
