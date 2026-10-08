const n=`<script setup lang="ts">
// 对齐 antd 的 \`pagination\` demo。
import { List, ListItem } from '@apollo-design/ui';
import { h } from 'vue';

const data = Array.from({ length: 12 }).map((_, i) => \`item \${i + 1}\`);

const renderItem = (item: unknown) => h(ListItem, null, { default: () => String(item) });
<\/script>

<template>
  <List
    :pagination="{ pageSize: 3, position: 'both' }"
    :data-source="data"
    :render-item="renderItem"
  />
</template>
`;export{n as default};
