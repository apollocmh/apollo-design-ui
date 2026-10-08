const e=`<script setup lang="ts">
// 对齐 antd 的 demo/render-panel.tsx

import { Tooltip, TooltipPurePanel } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif">
    <TooltipPurePanel title="Hello, Pink Pure Panel!" color="pink" />
    <TooltipPurePanel title="Hello, Customize Color Pure Panel!" color="#f50" />
    <TooltipPurePanel title="Hello, Pure Panel!" placement="bottomLeft" :style="{ width: '200px' }" />
  </div>
</template>
`;export{e as default};
