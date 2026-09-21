<script setup lang="ts">
// 对齐 antd 的 error demo（含 body 内容区）

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
    status="error"
    title="Submission Failed"
    sub-title="Please check and modify the following information before resubmitting."
    :extra="extraNode()"
  >
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
