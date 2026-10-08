const n=`<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
import { ConfigProvider, Steps } from '@apollo-design/ui';

const items = [
  { title: '第一步', content: '说明' },
  { title: '第二步', content: '说明' },
];
<\/script>

<template>
  <ConfigProvider
    :theme="{ components: { Steps: { iconSize: 40, customIconFontSize: 20 } } }"
  >
    <Steps :items="items" :current="1" />
  </ConfigProvider>
</template>
`;export{n as default};
