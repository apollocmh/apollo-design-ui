const o=`<script setup lang="ts">
// 对齐 antd 的 wireframe demo
// ⚠️ PLATFORM 等价替换：antd 用 \`ConfigProvider theme.token.wireframe\`；本仓零运行时 ——
//    按 wireframe=true 的 \`prepareComponentToken\` 分支覆盖那 3 个受影响的 Token
//    （dotSize / radioColor / radioBgColor）。
import { Radio } from '@apollo-design/ui';

const options = [
  { value: 1, label: 'A' },
  { value: 2, label: 'B' },
  { value: 3, label: 'C' },
  { value: 4, label: 'D' },
];
<\/script>

<template>
  <div class="demo-radio-wireframe">
    <Radio.Group :value="1" :options="options" />
    <br />
    <Radio.Group :value="1" :options="options" disabled />
  </div>
</template>

<style>
/* wireframe 分支：dotSize = radioSize - dotPadding*2 = 8（非 wireframe 是 6）；
   radioColor = colorPrimary、radioBgColor = colorBgContainer。 */
.demo-radio-wireframe .apollo-radio-group,
.demo-radio-wireframe .apollo-radio-wrapper {
  --apollo-radio-dot-size: 8;
  --apollo-radio-radio-color: var(--apollo-color-primary);
  --apollo-radio-radio-bg-color: var(--apollo-color-bg-container);
}
</style>
`;export{o as default};
