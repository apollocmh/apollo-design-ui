const t=`<script setup lang="ts">
// 对齐 antd demo/progress-dot.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '等待中', content: '请您耐心等待' },
  { title: '处理中', content: '商品正在打包' },
  { title: '已发货', content: '商品已发出' },
  { title: '已完成', content: '感谢使用' },
];
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Steps :items="items" type="dot" :current="1" />
    <Steps :items="items" type="dot" :current="1" orientation="vertical" />
  </div>
</template>
`;export{t as default};
