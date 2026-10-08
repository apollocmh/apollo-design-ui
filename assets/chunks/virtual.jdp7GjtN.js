const t=`<script setup lang="ts">
// 对齐 antd 的 virtual 用法
import { Listy } from '@apollo-design/ui';

const items = Array.from({ length: 1000 }, (_, i) => ({ key: i, content: \`Item \${i}\` }));
<\/script>

<template>
  <Listy :items="items" row-key="key" virtual :height="280">
    <template #default="{ item }">{{ item.content }}</template>
  </Listy>
</template>
`;export{t as default};
