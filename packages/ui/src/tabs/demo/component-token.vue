<script setup lang="ts">
import { ConfigProvider, Select, Space, Tabs, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const presets = [
  {
    value: 'blue',
    label: '默认蓝',
    inkBar: '#1677ff',
    selected: '#002c8c',
    hover: '#003eb3',
    fontSize: 14,
    gutter: 32,
  },
  {
    value: 'purple',
    label: '紫罗兰',
    inkBar: '#722ed1',
    selected: '#722ed1',
    hover: '#531dab',
    fontSize: 16,
    gutter: 24,
  },
  {
    value: 'green',
    label: '青绿色',
    inkBar: '#389e0d',
    selected: '#237804',
    hover: '#135200',
    fontSize: 18,
    gutter: 16,
  },
];

type PresetValue = (typeof presets)[number]['value'];

const preset = ref<PresetValue>('blue');
const activeKey = ref('1');

const currentPreset = computed(
  () =>
    presets.find((item) => item.value === preset.value) ?? { inkBar: '#1677ff', selected: '#002c8c', hover: '#003eb3', fontSize: 14, gutter: 32 },
);

const theme = computed(() => ({
  components: {
    Tabs: {
      inkBarColor: currentPreset.value.inkBar,
      itemSelectedColor: currentPreset.value.selected,
      itemHoverColor: currentPreset.value.hover,
      titleFontSize: currentPreset.value.fontSize,
      horizontalItemGutter: currentPreset.value.gutter,
    },
  },
}));

const items = [
  { key: '1', label: '设计规范', children: '指示条颜色、选中文字颜色与字号由组件 Token 控制。' },
  {
    key: '2',
    label: '开发指南',
    children: '切换配色预设会实时更新 ConfigProvider 的 Tabs 组件 Token。',
  },
  { key: '3', label: '发布记录', children: '页签间距来自 --apollo-tabs-horizontal-item-gutter。' },
];

function onPresetChange(value: unknown): void {
  if (value === 'blue' || value === 'purple' || value === 'green') preset.value = value;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>主题配色</span>
      <Select
        :value="preset"
        :options="presets"
        style="width: 140px"
        @change="onPresetChange"
      />
      <Tag color="blue">字号 {{ currentPreset.fontSize }}</Tag>
      <Tag>页签间距 {{ currentPreset.gutter }}</Tag>
    </Space>

    <ConfigProvider :theme="theme">
      <Tabs v-model:active-key="activeKey" :items="items" />
    </ConfigProvider>
  </div>
</template>
