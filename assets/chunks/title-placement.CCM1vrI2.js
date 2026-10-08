const t=`<script setup lang="ts">
// 对齐 antd demo/title-placement.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '第一步', content: '请填写信息' },
  { title: '第二步', content: '请确认信息' },
  { title: '第三步', content: '请提交' },
];
<\/script>

<template>
  <Steps :items="items" :current="1" title-placement="vertical" />
</template>
`;export{t as default};
