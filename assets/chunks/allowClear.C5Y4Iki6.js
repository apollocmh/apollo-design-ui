const n=`<script setup lang="ts">
// 对齐 antd demo/allowClear.tsx
// ⚠️ demo 级替换：antd 用 \`@ant-design/icons\` 的 \`CloseSquareFilled\`；本仓
//    \`@apollo-design/icons\` 在**视觉层用例**里解析不到（用例只链接 theme+ui）⇒
//    用等价的字符画占位（见 README §5）。
import { Mentions } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('hello world');
<\/script>

<template>
  <div>
    <Mentions v-model:value="value" allow-clear />
    <br />
    <br />
    <Mentions v-model:value="value" :allow-clear="{ clearIcon: '✖' }" />
    <br />
    <br />
    <Mentions v-model:value="value" allow-clear :rows="3" />
  </div>
</template>
`;export{n as default};
