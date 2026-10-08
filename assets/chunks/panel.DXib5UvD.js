const n=`<script setup lang="ts">
// 对齐 antd 的 render-panel demo（CascaderPanel）
import { CascaderPanel } from '@apollo-design/ui';

const options = [
  { value: 'zhejiang', label: '浙江', children: [{ value: 'hangzhou', label: '杭州' }] },
];
<\/script>

<template>
  <CascaderPanel :options="options" />
</template>
`;export{n as default};
