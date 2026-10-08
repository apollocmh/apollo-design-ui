const t=`<script setup lang="ts">
// 对齐 antd demo/placement.tsx（12 方向）。antd 用 ConfigProvider button 统一宽度，
// 本仓 D25：直接给按钮行内样式（语义等价）。
import { Button, Popover } from '@apollo-design/ui';

const text = 'Title';

const btnStyle = { width: '80px', margin: '4px' };
const rowStyle = { whiteSpace: 'nowrap' };
<\/script>

<template>
  <div style="display: flex; flex-direction: column; align-items: center; row-gap: 16px">
    <div :style="rowStyle">
      <Popover v-for="p in ['topLeft', 'top', 'topRight']" :key="p" :placement="p" :title="text">
        <template #content>
          <p>Content</p>
          <p>Content</p>
        </template>
        <Button :style="btnStyle">{{ p }}</Button>
      </Popover>
    </div>
    <div :style="rowStyle">
      <Popover v-for="p in ['leftTop', 'left', 'leftBottom', 'rightTop', 'right', 'rightBottom']" :key="p" :placement="p" :title="text">
        <template #content>
          <p>Content</p>
          <p>Content</p>
        </template>
        <Button :style="btnStyle">{{ p }}</Button>
      </Popover>
    </div>
    <div :style="rowStyle">
      <Popover v-for="p in ['bottomLeft', 'bottom', 'bottomRight']" :key="p" :placement="p" :title="text">
        <template #content>
          <p>Content</p>
          <p>Content</p>
        </template>
        <Button :style="btnStyle">{{ p }}</Button>
      </Popover>
    </div>
  </div>
</template>
`;export{t as default};
