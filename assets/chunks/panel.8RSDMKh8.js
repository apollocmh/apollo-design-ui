const t=`<script setup lang="ts">
// 对齐 antd demo/panel.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '选择模板', content: '挑选合适模板' },
  { title: '填写内容', content: '填充你的内容' },
  { title: '发布', content: '发布你的作品' },
];
<\/script>

<template>
  <Steps type="panel" :items="items" :current="1" />
</template>
`;export{t as default};
