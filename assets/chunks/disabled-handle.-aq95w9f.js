const e=`<script setup lang="ts">
// 对齐 antd \`disabled-handle.tsx\`：\`disabled\` 收**数组**时逐把手生效（禁用的把手不可聚焦、不可拖）。
import { Slider } from '@apollo-design/ui';
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Slider :default-value="[20, 60]" range :disabled="[true, false]" />
    <Slider :default-value="[10, 50, 90]" range :disabled="[false, true, false]" />
  </div>
</template>
`;export{e as default};
