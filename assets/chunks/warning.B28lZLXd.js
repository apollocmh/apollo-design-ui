const t=`<script setup lang="ts">
// 对齐 antd 的 warning demo。C8-R2：extra 走 \`#extra\` 插槽。
import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result
    status="warning"
    title="There are some problems with your operation."
    sub-title="More actions please."
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
`;export{t as default};
