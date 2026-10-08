const n=`<script setup lang="ts">
// 对齐 antd 的 basic demo
import { Cascader } from '@apollo-design/ui';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京', children: [{ value: 'zhonghuamen', label: '中华门' }] },
    ],
  },
];

const onChange = (value: unknown) => console.log(value);
<\/script>

<template>
  <Cascader :options="options" :on-change="onChange" placeholder="请选择地区" />
</template>
`;export{n as default};
