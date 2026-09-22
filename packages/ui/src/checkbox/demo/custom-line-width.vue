<script setup lang="ts">
// 对齐 antd 的 custom-line-width demo
// ⚠️ PLATFORM 替换：antd 用 ConfigProvider theme.token.lineWidth；本仓无
//    theme token 注入，用语义化 styles.icon 演示同等视觉（README §2 登记）。
import { Checkbox } from '@apollo-design/ui';

const styles = {
  icon: { borderWidth: '3px' },
};
</script>

<template>
  <Checkbox :styles="styles">lineWidth = 3px</Checkbox>
</template>
