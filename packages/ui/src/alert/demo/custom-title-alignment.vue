<script setup lang="ts">
// 对齐 antd 的 custom-title-alignment demo
// ⚠️ 内联样式数字必须转 px 字符串（Vue patchStyle 不转换，坑 #1）
import { Alert, Button } from '@apollo-design/ui';

const titleLineHeight = 22;
const iconSize = 14;
const closeIconSize = 12;
const smallButtonHeight = 24;

const firstLineStyles = {
  root: { alignItems: 'flex-start' },
  icon: { marginBlockStart: `${(titleLineHeight - iconSize) / 2}px` },
  actions: { marginBlockStart: `${(titleLineHeight - smallButtonHeight) / 2}px` },
  close: { marginBlockStart: `${(titleLineHeight - closeIconSize) / 2}px` },
};
</script>

<template>
  <Alert
    style="width: 360px"
    title="Long alert title wraps to multiple lines when the alert container is narrow enough."
    type="info"
    show-icon
    closable
    :styles="firstLineStyles"
  >
    <template #action>
      <Button size="small" type="text">Action</Button>
    </template>
  </Alert>
</template>
