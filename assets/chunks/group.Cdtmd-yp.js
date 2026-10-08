const t=`<script setup lang="ts">
// 对齐 antd 的 group + sticky 用法
import { Listy } from '@apollo-design/ui';

const items = Array.from({ length: 12 }, (_, i) => ({
  key: i,
  group: \`Group \${i % 3}\`,
  content: \`Item \${i}\`,
}));

const group = {
  key: (item: Record<string, unknown>) => item.group as string,
  title: (key: unknown, groupItems: unknown[]) => \`\${key} (\${groupItems.length})\`,
};
<\/script>

<template>
  <Listy :items="items" row-key="key" :group="group" sticky :height="280">
    <template #default="{ item }">{{ item.content }}</template>
  </Listy>
</template>
`;export{t as default};
