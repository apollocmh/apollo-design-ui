const t=`<script setup lang="ts">
// 对齐 antd 的 success demo

import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result
    status="success"
    title="Successfully Purchased Cloud Server ECS!"
    sub-title="Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait."
  >
    <template #extra>
      <div>
        <Button type="primary">Go Console</Button>
        <Button>Buy Again</Button>
      </div>
    </template>
  </Result>
</template>
`;export{t as default};
