<script setup lang="ts">
// 对齐 antd 的 basic demo
// ⚠️ 加 `aria-label`：axe 要求 `role="switch"` 有可访问名（上游同 demo 无名字，
//    那是上游自己的 a11y 缺口 —— 本仓按更严格标准，登记在 README §2）。
import { Switch } from '@apollo-design/ui';

const onChange = (checked: boolean) => {
  console.log(`switch to ${checked}`);
};
</script>

<template>
  <Switch default-checked aria-label="Switch" @change="onChange" />
</template>
