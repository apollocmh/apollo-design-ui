const a=`<script setup lang="ts">
// 对齐 antd 的 disabled-alpha demo：禁用透明度。
// ⚠️ 默认值用**不透明**色（\`#1677ff\`）—— 半透明色 + \`disabledAlpha\` 会触发上游同款的
//    「alpha 被强制为 100%」开发期告警（本 demo 有意不触发它）。
import { ColorPicker } from '@apollo-design/ui';
<\/script>

<template>
  <ColorPicker default-value="#1677ff" disabled-alpha />
</template>
`;export{a as default};
