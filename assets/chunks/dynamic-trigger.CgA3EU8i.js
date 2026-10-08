const n=`<script setup lang="ts">
// 对齐 antd 的 dynamic-trigger demo

import { Button, Popconfirm, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const condition = ref(true);

const changeOpen = (next: boolean) => {
  if (!condition.value) return;
  open.value = next;
};

const changeCondition = (checked: boolean) => {
  condition.value = checked;
};
<\/script>

<template>
  <div style="display: flex; align-items: center; gap: 8px">
    <Popconfirm
      :open="open"
      title="Delete the task"
      description="Are you sure to delete this task?"
      :on-open-change="changeOpen"
    >
      <Button danger>Delete a task</Button>
    </Popconfirm>
    <div>
      Whether directly execute:
      <Switch aria-label="Whether directly execute" :checked="condition" @update:checked="changeCondition" />
    </div>
  </div>
</template>
`;export{n as default};
