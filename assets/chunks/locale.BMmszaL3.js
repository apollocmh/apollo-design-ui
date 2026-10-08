const t=`<script setup lang="ts">
// 对齐 antd 的 locale demo：okText / cancelText 定制
import { Button, Popconfirm } from '@apollo-design/ui';
<\/script>

<template>
  <Popconfirm
    title="Delete the task"
    description="Are you sure to delete this task?"
    ok-text="Yes"
    cancel-text="No"
  >
    <Button danger>Delete</Button>
  </Popconfirm>
</template>
`;export{t as default};
