const e=`<script setup lang="ts">
// 对齐 antd \`basic.tsx\`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: \`content\${i + 1}\`,
  description: \`description of content\${i + 1}\`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<string[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
const selectedKeys = ref<string[]>(['1', '4']);

const handleChange = (newTargetKeys: TransferKey[]) => {
  targetKeys.value = newTargetKeys.map(String);
};
<\/script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    :selected-keys="selectedKeys"
    @change="handleChange"
  />
</template>
`;export{e as default};
