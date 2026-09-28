<script setup lang="ts">
// 对齐 antd 的 basic demo
import { Button, Popconfirm } from '@apollo-design/ui';

const confirm = (e?: MouseEvent) => console.log(e);
const cancel = (e?: MouseEvent) => console.log(e);
</script>

<template>
  <Popconfirm
    title="Delete the task"
    description="Are you sure to delete this task?"
    :on-confirm="confirm"
    :on-cancel="cancel"
    ok-text="Yes"
    cancel-text="No"
  >
    <Button danger>Delete</Button>
  </Popconfirm>
</template>
