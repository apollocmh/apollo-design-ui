<script setup lang="ts">
// 对齐 antd 的 custom-render demo：optionRender + displayRender
import { Cascader } from '@apollo-design/ui';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖' },
          { value: 'lingyin', label: '灵隐寺' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];
</script>

<template>
  <Cascader
    :options="options"
    placeholder="自定义选项与展示文案"
  >
    <template #displayRender="{ labels }">
      <span style="color: #1677ff; font-weight: 600">{{ labels.join(' → ') }}</span>
    </template>
    <template #optionRender="{ option }">
      <span style="display: inline-flex; align-items: center; gap: 6px">
        <span :style="{ width: '6px', height: '6px', borderRadius: '50%', background: option.disabled ? '#bfbfbf' : '#52c41a' }" />
        {{ option.label }}
      </span>
    </template>
  </Cascader>
  <p>下拉选项带状态圆点，选中后面包屑用「→」连接。</p>
</template>
