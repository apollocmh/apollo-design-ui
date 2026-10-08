const t=`<script setup lang="ts">
// 对齐 antd demo/progress.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '步骤一', content: '这是步骤一的描述' },
  { title: '步骤二', content: '这是步骤二的描述' },
  { title: '步骤三', content: '这是步骤三的描述' },
];
<\/script>

<template>
  <Steps type="default" :items="items" :current="1" :percent="60" />
</template>
`;export{t as default};
