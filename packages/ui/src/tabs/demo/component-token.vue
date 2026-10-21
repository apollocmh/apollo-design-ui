<script setup lang="ts">
import { Select, Space, Tabs, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const presets = [
  {
    value: 'blue',
    label: '默认蓝',
    inkBar: '#1677ff',
    selected: '#1677ff',
    hover: '#4096ff',
    fontSize: '14px',
    gutter: '32px',
  },
  {
    value: 'purple',
    label: '紫罗兰',
    inkBar: '#722ed1',
    selected: '#722ed1',
    hover: '#9254de',
    fontSize: '16px',
    gutter: '24px',
  },
  {
    value: 'green',
    label: '青绿色',
    inkBar: '#389e0d',
    selected: '#389e0d',
    hover: '#52c41a',
    fontSize: '18px',
    gutter: '16px',
  },
];

type PresetValue = (typeof presets)[number]['value'];

const preset = ref<PresetValue>('blue');
const activeKey = ref('1');

const currentPreset = computed(
  () =>
    presets.find((item) => item.value === preset.value) ?? (presets[0] as (typeof presets)[number]),
);

const tokenStyle = computed(() => ({
  '--apollo-tabs-ink-bar-color': currentPreset.value.inkBar,
  '--apollo-tabs-item-selected-color': currentPreset.value.selected,
  '--apollo-tabs-item-hover-color': currentPreset.value.hover,
  '--apollo-tabs-title-font-size': currentPreset.value.fontSize,
  '--apollo-tabs-horizontal-item-gutter': currentPreset.value.gutter,
}));

const items = [
  { key: '1', label: '设计规范', children: '指示条颜色、选中文字颜色与字号由组件 Token 控制。' },
  {
    key: '2',
    label: '开发指南',
    children: '切换配色预设会实时覆盖根节点上的 --apollo-tabs-* 变量。',
  },
  { key: '3', label: '发布记录', children: '页签间距来自 --apollo-tabs-horizontal-item-gutter。' },
];

function onPresetChange(value: unknown): void {
  preset.value = value as PresetValue;
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

    <Tabs
      v-model:active-key="activeKey"
      :items="items"
      :style="tokenStyle"
    />
  </div>
</template>
