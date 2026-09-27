<script setup lang="ts">
// 对齐 antd demo/progress-ring.tsx（showProgress 进度环）
import { FloatButtonBackTop } from '@apollo-design/ui';
</script>

<template>
  <div style="height: 300vh; padding: 10px">
    <div>Scroll to bottom</div>
    <FloatButtonBackTop :visibility-height="0" show-progress />
  </div>
</template>
