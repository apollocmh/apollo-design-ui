const e=`<script setup lang="ts">
// 对齐 antd \`oneway.tsx\`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: \`content\${i + 1}\`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<TransferKey[]>(['2', '4']);

const handleChange = (newTargetKeys: TransferKey[]) => {
  targetKeys.value = newTargetKeys;
};
<\/script>

<template>
  <Transfer :data-source="mockData" one-way :target-keys="targetKeys" @change="handleChange" />
</template>
`;export{e as default};
