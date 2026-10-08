const t=`<script setup lang="ts">
// 对齐 antd \`custom-select-all-labels.tsx\`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 10 }, (_, i) => ({
  key: i.toString(),
  title: \`content\${i + 1}\`,
}));

const targetKeys = ref<string[]>(['2', '4']);
<\/script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    :select-all-labels="[
      ({ selectedCount, totalCount }: { selectedCount: number; totalCount: number }) =>
        \`\${selectedCount}/\${totalCount} 条\`,
      '已选列表',
    ]"
  />
</template>
`;export{t as default};
