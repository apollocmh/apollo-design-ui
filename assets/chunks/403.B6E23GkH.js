const t=`<script setup lang="ts">
// 对齐 antd 的 403 demo（静态插画分支）。C8-R2：extra 走 \`#extra\` 插槽。
import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result
    status="403"
    title="403"
    sub-title="Sorry, you are not authorized to access this page."
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
`;export{t as default};
