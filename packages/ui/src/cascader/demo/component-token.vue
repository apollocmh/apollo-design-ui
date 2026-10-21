<script setup lang="ts">
// 对齐 antd 的 component-token demo。
// 本仓零运行时：Cascader 的 Component Token 就是 `--apollo-cascader-*` CSS 变量，
// 在触发器和浮层根上覆盖同名变量即可（8 个 token 见 cascader/style/token.ts）。
import { Cascader, Switch, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const value = ref<string[]>(['zhejiang', 'hangzhou']);

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

    <Cascader
      v-model:value="value"
      :options="options"
      :popup-class-name="custom ? 'cascader-component-token-popup' : undefined"
      placeholder="请选择地区"
    />

    <p style="margin-bottom: 0">
      当前选择：{{ value.length ? value.join(' / ') : '尚未选择' }}
    </p>
  </div>
</template>

<style>
.cascader-component-token-demo.is-custom .apollo-cascader,
.apollo-cascader-dropdown.cascader-component-token-popup {
  --apollo-cascader-control-width: 260px;
  --apollo-cascader-control-item-width: 142px;
  --apollo-cascader-dropdown-height: 220px;
  --apollo-cascader-option-selected-bg: #fff0f6;
  --apollo-cascader-option-selected-font-weight: 700;
  --apollo-cascader-option-selected-color: #c41d7f;
  --apollo-cascader-option-padding: 8px 14px;
  --apollo-cascader-menu-padding: 8px;
}
</style>
