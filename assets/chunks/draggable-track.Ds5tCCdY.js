const a=`<script setup lang="ts">
// 对齐 antd \`draggableTrack.tsx\`：\`range.draggableTrack\` 可拖整条已选轨道
// （⚠️ 与 \`editable\` 互斥；\`step: null\` 时被自动关闭并告警）。
import { Slider } from '@apollo-design/ui';
<\/script>

<template>
  <Slider :default-value="[20, 60]" :range="{ draggableTrack: true }" />
</template>
`;export{a as default};
