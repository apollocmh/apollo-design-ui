<script setup lang="ts">
// 对齐 antd 的 `large-data` demo：100 条数据 + 分页 + 搜索。
import type { TransferItem, TransferKey } from '@apollo-design/ui';
import { Text, Transfer } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const dataSource: TransferItem[] = Array.from({ length: 100 }, (_, i) => ({
  key: `item-${i}`,
  title: `Content ${i + 1}`,
  description: `Description of content ${i + 1}`,
  disabled: i % 17 === 0,
}));

const targetKeys = ref<TransferKey[]>(
  dataSource.filter((_, i) => i % 3 === 0).map((item) => item.key),
);

const targetCount = computed(() => targetKeys.value.length);

const onChange = (keys: TransferKey[]) => {
  targetKeys.value = keys;
};
</script>

<template>
  <div>
    <Transfer
      :data-source="dataSource"
      :target-keys="targetKeys"
      :pagination="{ pageSize: 10 }"
      :titles="['Source (100)', 'Target']"
      show-search
      show-select-all
      @change="onChange"
    />
    <div style="margin-top: 12px">
      <Text type="secondary">右侧 {{ targetCount }} 项；分页每页 10 条，可搜索筛选。</Text>
    </div>
  </div>
</template>
