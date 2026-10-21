<script setup lang="ts">
// 对齐 antd 的 `actions` demo：用箭头图标替换默认操作按钮文案。
import { ArrowLeftOutlined, ArrowRightOutlined } from '@apollo-design/icons';
import type { TransferKey } from '@apollo-design/ui';
import { Text, Transfer } from '@apollo-design/ui';
import { h, ref } from 'vue';

const dataSource = Array.from({ length: 12 }, (_, i) => ({
  key: String(i),
  title: `Content ${i + 1}`,
  description: `Description ${i + 1}`,
}));

const targetKeys = ref<TransferKey[]>(['2', '4']);
const actions = [h(ArrowRightOutlined), h(ArrowLeftOutlined)];

const onChange = (keys: TransferKey[]) => {
  targetKeys.value = keys;
};
</script>

<template>
  <div>
    <Transfer
      :data-source="dataSource"
      :target-keys="targetKeys"
      :actions="actions"
      show-search
      @change="onChange"
    />
    <div style="margin-top: 12px">
      <Text type="secondary">操作按钮使用 `actions` 自定义为箭头图标；当前右侧 {{ targetKeys.length }} 项。</Text>
    </div>
  </div>
</template>
