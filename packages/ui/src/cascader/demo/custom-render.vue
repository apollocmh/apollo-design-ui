<script setup lang="ts">
// 对齐 antd 的 custom-render demo：optionRender + displayRender
import { Cascader } from '@apollo-design/ui';
import { h } from 'vue';

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

const displayRender = (labels: unknown[]) =>
  h('span', { style: { color: '#1677ff', fontWeight: 600 } }, labels.join(' → '));

const optionRender = (option: Record<string, unknown>) =>
  h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, [
    h('span', {
      style: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: option.disabled ? '#bfbfbf' : '#52c41a',
      },
    }),
    String(option.label ?? ''),
  ]);
</script>

<template>
  <Cascader
    :options="options"
    :display-render="displayRender"
    :option-render="optionRender"
    placeholder="自定义选项与展示文案"
  />
  <p>下拉选项带状态圆点，选中后面包屑用「→」连接。</p>
</template>
