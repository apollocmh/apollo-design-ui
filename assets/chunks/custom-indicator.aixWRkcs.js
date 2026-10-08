const n=`<script setup lang="ts">
import { h } from 'vue';
import { Spin } from '../../index';

/**
 * 自定义指示符。
 *
 * ⚠️ \`indicator\` 的类型是 \`VNode\`（antd 侧是 \`React.ReactElement\`），所以必须传
 *    \`h(...)\` 的**结果**而不是一个组件 —— 传函数式组件是类型错误。
 * 上游 demo 用的是 \`<LoadingOutlined />\`（图标库），这里用等价的内联 SVG 代替。
 */
const indicator = h(
  'svg',
  {
    width: '1em',
    height: '1em',
    viewBox: '0 0 24 24',
    fill: 'none',
    focusable: 'false',
    'aria-hidden': 'true',
  },
  [
    h('circle', {
      cx: '12',
      cy: '12',
      r: '9',
      stroke: 'currentColor',
      'stroke-width': '3',
      'stroke-linecap': 'round',
      'stroke-dasharray': '42 14',
    }),
  ],
);

const bigIndicator = h(
  'svg',
  {
    width: '48',
    height: '48',
    viewBox: '0 0 24 24',
    fill: 'none',
    focusable: 'false',
    'aria-hidden': 'true',
  },
  [
    h('circle', {
      cx: '12',
      cy: '12',
      r: '9',
      stroke: '#1677ff',
      'stroke-width': '3',
      'stroke-linecap': 'round',
      'stroke-dasharray': '42 14',
    }),
  ],
);

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
<\/script>

<template>
  <div :style="rowStyle">
    <Spin :indicator="indicator" size="small" />
    <Spin :indicator="indicator" />
    <Spin :indicator="indicator" size="large" />
    <Spin :indicator="bigIndicator" />
  </div>
</template>
`;export{n as default};
