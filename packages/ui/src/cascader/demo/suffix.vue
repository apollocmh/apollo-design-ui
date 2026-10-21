<script setup lang="ts">
// 对齐 antd 的 suffix demo：suffixIcon 可替换默认箭头
import { EnvironmentOutlined, RocketOutlined, SmileOutlined } from '@apollo-design/icons';
import { Cascader, Select, Tag } from '@apollo-design/ui';
import { type Component, computed, h, ref } from 'vue';

type IconMode = 'smile' | 'environment' | 'rocket';

const iconMode = ref<IconMode>('smile');

const iconOptions: { value: IconMode; label: string }[] = [
  { value: 'smile', label: 'Smile' },
  { value: 'environment', label: 'Environment' },
  { value: 'rocket', label: 'Rocket' },
];

const iconMap: Record<IconMode, Component> = {
  smile: SmileOutlined,
  environment: EnvironmentOutlined,
  rocket: RocketOutlined,
};

const suffixIcon = computed(() =>
  h(iconMap[iconMode.value], { style: { color: '#fa8c16', fontSize: '16px' } }),
);

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

function onIconChange(value: unknown): void {
  iconMode.value = value as IconMode;
}
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <span>后缀图标</span>
      <Select
        aria-label="后缀图标"
        :value="iconMode"
        :options="iconOptions"
        style="width: 140px"
        @change="onIconChange"
      />
      <Tag color="orange">{{ iconMode }}</Tag>
    </div>

    <Cascader :options="options" :suffix-icon="suffixIcon" placeholder="请选择地区" />

    <p style="margin-bottom: 0">`suffixIcon` 会替换默认的下拉箭头，不会影响浮层展开。</p>
  </div>
</template>
