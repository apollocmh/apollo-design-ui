const t=`<script setup lang="ts">
// 对齐 antd 的 404 demo。C8-R2：extra 走 \`#extra\` 插槽。
import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result
    status="404"
    title="404"
    sub-title="Sorry, the page you visited does not exist."
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
`;export{t as default};
