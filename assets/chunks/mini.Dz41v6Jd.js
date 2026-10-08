const i=`<script setup lang="ts">
// 对齐 antd \`mini.tsx\`。
import { Pagination } from '@apollo-design/ui';
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Pagination size="small" :total="50" show-size-changer show-quick-jumper />
    <Pagination size="small" :total="50" show-size-changer show-quick-jumper disabled />
  </div>
</template>
`;export{i as default};
