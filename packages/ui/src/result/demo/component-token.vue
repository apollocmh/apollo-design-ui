<script setup lang="ts">
// 对齐 antd 的 component-token demo：覆盖 Result 的四个 Component Token。
import { Button, Result } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-result-token">
    <Result
      status="success"
      title="操作成功"
      sub-title="标题、副标题、图标字号与操作区间距均由 Component Token 控制。"
    >
      <template #extra>
        <Button type="primary">查看详情</Button>
      </template>
    </Result>
  </div>
</template>

<style>
.demo-result-token .apollo-result {
  --apollo-result-title-font-size: 32px;
  --apollo-result-subtitle-font-size: 18px;
  --apollo-result-icon-font-size: 96px;
  --apollo-result-extra-margin: 16px 0 0 0;
}
</style>
