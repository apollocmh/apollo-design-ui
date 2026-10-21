<script setup lang="ts">
import type { CollapseItemType } from '@apollo-design/ui';
import { Collapse, Select, Space, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const presets = [
  {
    value: 'blue',
    label: '海蓝',
    headerBg: '#e6f4ff',
    contentBg: '#f0f7ff',
  },
  {
    value: 'purple',
    label: '紫罗兰',
    headerBg: '#f9f0ff',
    contentBg: '#fbf5ff',
  },
  {
    value: 'green',
    label: '青绿',
    headerBg: '#f6ffed',
    contentBg: '#f8fff0',
  },
];

type PresetValue = (typeof presets)[number]['value'];

const preset = ref<PresetValue>('blue');

const currentPreset = computed(
  () =>
    presets.find((item) => item.value === preset.value) ?? (presets[0] as (typeof presets)[number]),
);

const tokenStyle = computed(() => ({
  '--apollo-collapse-header-bg': currentPreset.value.headerBg,
  '--apollo-collapse-content-bg': currentPreset.value.contentBg,
  '--apollo-collapse-header-padding': '14px 20px',
  '--apollo-collapse-content-padding': '16px 20px',
}));

const items: CollapseItemType[] = [
  {
    key: '1',
    label: '通过 CSS 变量覆盖组件 Token',
    children: 'header-bg、content-bg 与内边距都来自 --apollo-collapse-* 变量。',
  },
  {
    key: '2',
    label: '切换配色方案',
    children: '选择不同的预设会实时改写根节点上的组件 Token 变量。',
  },
];

function onPresetChange(value: unknown): void {
  preset.value = value as PresetValue;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>配色</span>
      <Select
        aria-label="配色方案"
        :value="preset"
        :options="presets"
        style="width: 140px"
        @change="onPresetChange"
      />
      <Tag color="blue">--apollo-collapse-header-bg: {{ currentPreset.headerBg }}</Tag>
      <Tag>--apollo-collapse-content-bg: {{ currentPreset.contentBg }}</Tag>
    </Space>

    <Collapse :items="items" :style="tokenStyle" />
  </div>
</template>
