const t=`<script setup lang="ts">
// 对齐 antd \`show-tooltip.tsx\`：\`tooltip.open\` 受控开合（\`false\` ⇒ 永不显示）。
import { Slider } from '@apollo-design/ui';
<\/script>

<template>
  <Slider :default-value="30" :tooltip="{ open: true }" />
</template>
`;export{t as default};
