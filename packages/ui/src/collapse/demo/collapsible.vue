<script setup lang="ts">
import type { CollapseItemType, CollapsibleType } from '@apollo-design/ui';
import { Collapse, Select, Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const collapsible = ref<CollapsibleType>('header');
const activeKey = ref<string[]>(['1']);

const collapsibleOptions: { value: CollapsibleType; label: string }[] = [
  { value: 'header', label: 'header（点击标题）' },
  { value: 'icon', label: 'icon（仅点击图标）' },
  { value: 'disabled', label: 'disabled（禁止折叠）' },
];

const items: CollapseItemType[] = [
  {
    key: '1',
    label: '面板一：点击区域由 collapsible 决定',
    children: 'header 模式点击标题按钮；icon 模式只激活图标按钮。两者均支持 Enter 与 Space。',
  },
  {
    key: '2',
    label: '面板二：切换模式后再试试',
    children: '选择 icon 后只有箭头按钮可操作；选择 disabled 后保留当前展开状态，且不能切换。',
  },
];

function onCollapsibleChange(value: unknown): void {
  if (value === 'header' || value === 'icon' || value === 'disabled') collapsible.value = value;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>collapsible</span>
      <Select
        aria-label="折叠触发方式"
        :value="collapsible"
        :options="collapsibleOptions"
        style="width: 220px"
        @change="onCollapsibleChange"
      />
      <Tag color="blue">{{ collapsible }}</Tag>
      <Tag>当前展开：{{ activeKey.length ? activeKey.join('、') : '无' }}</Tag>
    </Space>

    <Collapse v-model:active-key="activeKey" :items="items" :collapsible="collapsible" />
  </div>
</template>
