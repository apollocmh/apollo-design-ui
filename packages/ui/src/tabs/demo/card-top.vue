<script setup lang="ts">
import type { TabPlacement } from '@apollo-design/ui';
import { Select, Space, Tabs, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const activeKey = ref('1');
const placement = ref<TabPlacement>('top');

const placementOptions: { value: TabPlacement; label: string }[] = [
  { value: 'top', label: 'top（顶部）' },
  { value: 'bottom', label: 'bottom（底部）' },
];

const items = [
  { key: '1', label: '概览', children: '卡片式页签位于内容顶部，适合展示模块分组。' },
  { key: '2', label: '配置', children: '切换 tabPlacement 可以将同一组页签移动到内容底部。' },
  { key: '3', label: '日志', children: '当前激活页签由 v-model:activeKey 受控。' },
];

function onPlacementChange(value: unknown): void {
  placement.value = value as TabPlacement;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>tabPlacement</span>
      <Select
        :value="placement"
        :options="placementOptions"
        style="width: 160px"
        @change="onPlacementChange"
      />
      <Tag color="blue">activeKey: {{ activeKey }}</Tag>
    </Space>

    <Tabs
      v-model:active-key="activeKey"
      type="card"
      :tab-placement="placement"
      :items="items"
    />
  </div>
</template>
