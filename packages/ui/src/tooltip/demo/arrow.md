## zh-CN

支持显示、隐藏以及将箭头保持居中定位。

## en-US

Support show, hide or keep arrow in the center.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/arrow.tsx（Segmented 未落地 ⇒ 原生 select 替换，见文件头登记）

import { ref } from 'vue';
import { Button, Tooltip } from '@apollo-design/ui';

type ArrowMode = 'show' | 'hide' | 'center';

const arrowMode = ref<ArrowMode>('show');
const placement = ref('topLeft');
const placements = [
  'topLeft',
  'top',
  'topRight',
  'leftTop',
  'left',
  'leftBottom',
  'rightTop',
  'right',
  'rightBottom',
  'bottomLeft',
  'bottom',
  'bottomRight',
];

const arrowProp = () => {
  if (arrowMode.value === 'hide') return false;
  if (arrowMode.value === 'center') return { pointAtCenter: true };
  return true;
};
</script>

<template>
  <div style="font-family: sans-serif">
    <select v-model="arrowMode">
      <option value="show">Show Arrow</option>
      <option value="hide">Hide Arrow</option>
      <option value="center">Center Arrow</option>
    </select>
    <select v-model="placement">
      <option v-for="p in placements" :key="p" :value="p">{{ p }}</option>
    </select>
    <Tooltip :title="placement" :placement="placement as never" :arrow="arrowProp()">
      <Button style="margin: 8px">{{ placement }}</Button>
    </Tooltip>
  </div>
</template>

```
