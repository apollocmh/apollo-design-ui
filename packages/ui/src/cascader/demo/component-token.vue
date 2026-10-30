<script setup lang="ts">
// 对齐 antd 的 component-token demo。
// 当前Provider Token同步作用于触发器和teleport浮层。
import { Cascader, ConfigProvider, Switch, Tag } from '@apollo-design/ui';
import { ref } from 'vue';
import type { CascaderOutputValue } from '../interface';

const custom = ref(true);
const value = ref<CascaderOutputValue>(['zhejiang', 'hangzhou']);

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
  {
    value: 'guangdong',
    label: '广东',
    children: [{ value: 'shenzhen', label: '深圳' }],
  },
];
</script>

<template>
  <div class="cascader-component-token-demo" :class="{ 'is-custom': custom }">
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <Switch v-model:checked="custom" aria-label="启用自定义组件 Token" />
      <span>自定义 Token</span>
      <Tag color="blue">
        {{ custom ? '已覆盖宽度 / 选中态 / 内边距' : '默认 Token' }}
      </Tag>
    </div>

    <ConfigProvider :theme="{ components: { Cascader: custom ? { controlWidth: 260, controlItemWidth: 142, dropdownHeight: 220, optionSelectedBg: '#fff0f6', optionSelectedFontWeight: 700, optionSelectedColor: '#c41d7f', optionPadding: '8px 14px', menuPadding: 8 } : {} } }">
      <Cascader v-model:value="value" :options="options" placeholder="请选择地区" />
    </ConfigProvider>

    <p style="margin-bottom: 0">
      当前选择：{{ value.length ? value.join(' / ') : '尚未选择' }}
    </p>
  </div>
</template>
