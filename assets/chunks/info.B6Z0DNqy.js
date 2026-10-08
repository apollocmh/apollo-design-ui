const t=`<script setup lang="ts">
// 对齐 antd 的 info demo（默认 status = info）。C8-R2：extra 走 \`#extra\` 插槽。
import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result title="Your operation has been executed">
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
`;export{t as default};
