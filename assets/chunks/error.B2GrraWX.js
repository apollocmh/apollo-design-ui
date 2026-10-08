const t=`<script setup lang="ts">
// 对齐 antd 的 error demo（含 body 内容区）。C8-R2：extra 走 \`#extra\` 插槽。
import { Button, Result } from '@apollo-design/ui';
<\/script>

<template>
  <Result
    status="error"
    title="Submission Failed"
    sub-title="Please check and modify the following information before resubmitting."
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
      <Button>Buy Again</Button>
    </template>
    <div class="desc">
      <p style="font-size: 16px">
        <strong>The content you submitted has the following error:</strong>
      </p>
      <p>Your account has been frozen</p>
      <p>Your account is not yet entitled to submit</p>
    </div>
  </Result>
</template>

<style scoped>
.desc p {
  margin-bottom: 4px;
}
</style>
`;export{t as default};
