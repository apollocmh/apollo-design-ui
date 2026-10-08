const n=`<script setup lang="ts">
// 对齐 antd demo/arrow-point-at-center.tsx（12 方向 × 箭头指向中心 + 十字准星）
import { Popover } from '@apollo-design/ui';

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
] as const;

const itemStyle = {
  width: '120px',
  height: '120px',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px dashed purple',
  margin: '8px',
};
const boxStyle: Record<string, string> = {
  width: '40px',
  height: '40px',
  backgroundColor: 'deepskyblue',
  position: 'relative',
};
<\/script>

<template>
  <div style="max-width: 500px">
    <div v-for="p in placements" :key="p" :style="itemStyle">
      <Popover
        :placement="p"
        :content="p"
        :auto-adjust-overflow="false"
        :arrow="{ pointAtCenter: true }"
        force-render
        open
      >
        <div :style="boxStyle" />
      </Popover>
    </div>
  </div>
</template>
`;export{n as default};
