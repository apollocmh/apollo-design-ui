const e=`<script setup lang="ts">
// 对齐 antd \`advanced.tsx\`。
import type { TransferItem, TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 15 }, (_, i) => ({
  key: i.toString(),
  title: \`content\${i + 1}\`,
  chosen: i % 2 === 0,
}));

const oriTargetKeys = mockData.filter((item) => item.chosen).map((item) => item.key);

const selectedKeys = ref<string[]>([]);
const targetKeys = ref<string[]>([...oriTargetKeys]);

const handleChange = (newTargetKeys: TransferKey[]) => {
  targetKeys.value = newTargetKeys.map(String);
};

const handleSelectChange = (
  sourceSelectedKeys: TransferKey[],
  targetSelectedKeys: TransferKey[],
) => {
  selectedKeys.value = [...sourceSelectedKeys, ...targetSelectedKeys].map(String);
};
<\/script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    :selected-keys="selectedKeys"
    :render="(item: TransferItem) => String(item.title)"
    @change="handleChange"
    @select-change="handleSelectChange"
  />
</template>
`;export{e as default};
