<script setup lang="ts">
// 对齐 antd 的 success demo

import { Button, Result } from '@apollo-design/ui';
import { h } from 'vue';

// antd 的 extra 是 **prop**（ReactNode），不是插槽（规则 C19 只把 children 映射为插槽）
const extraNode = () =>
  h('div', null, [
    h(Button, { type: 'primary' }, () => 'Go Console'),
    h(Button, null, () => 'Buy Again'),
  ]);
</script>

<template>
  <Result
    status="success"
    title="Successfully Purchased Cloud Server ECS!"
    sub-title="Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait."
    :extra="extraNode()"
  />
</template>
