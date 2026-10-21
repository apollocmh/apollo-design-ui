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
    children: '当前模式为 header 时，点击整行标题即可展开或收起。',
  },
  {
    key: '2',
    label: '面板二：切换模式后再试试',
    children: '选择 icon 后只有右侧箭头可点击；选择 disabled 后面板保持展开且无法收起。',
  },
];

function onCollapsibleChange(value: unknown): void {
  collapsible.value = value as CollapsibleType;
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
