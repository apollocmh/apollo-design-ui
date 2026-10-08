const t=`<script setup lang="ts">
// 对齐 antd 的 basic 用法（items 数据驱动）
import { Listy } from '@apollo-design/ui';

const items = Array.from({ length: 8 }, (_, i) => ({ key: i, content: \`Item \${i}\` }));
<\/script>

<template>
  <Listy :items="items" row-key="key">
    <template #default="{ item }">{{ item.content }}</template>
  </Listy>
</template>
`;export{t as default};
