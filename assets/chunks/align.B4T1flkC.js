const n=`<script setup lang="ts">
// 对齐 antd \`align.tsx\`。
import { Pagination } from '@apollo-design/ui';
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Pagination align="start" :default-current="1" :total="50" />
    <Pagination align="center" :default-current="1" :total="50" />
    <Pagination align="end" :default-current="1" :total="50" />
  </div>
</template>
`;export{n as default};
