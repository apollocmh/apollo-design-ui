const t=`<script setup lang="ts">
// 对齐 antd \`vertical.tsx\`：\`orientation="vertical"\`（旧的 \`vertical\` 仍可用但已废弃）。
import { Slider } from '@apollo-design/ui';

const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' };
<\/script>

<template>
  <div style="height: 300px; display: flex; justify-content: center">
    <Slider orientation="vertical" :default-value="37" :marks="marks" />
  </div>
</template>
`;export{t as default};
