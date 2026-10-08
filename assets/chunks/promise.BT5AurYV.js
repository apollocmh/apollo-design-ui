const n=`<script setup lang="ts">
// 对齐 antd 的 promise demo：onConfirm 返回 Promise，resolve 后才关闭
import { Button, Popconfirm } from '@apollo-design/ui';

const confirm = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(null), 3000);
  });
<\/script>

<template>
  <Popconfirm
    title="Title"
    description="Open Popconfirm with Promise"
    :on-confirm="confirm"
    :on-open-change="() => console.log('open change')"
  >
    <Button type="primary">Open Popconfirm with Promise</Button>
  </Popconfirm>
</template>
`;export{n as default};
