<script setup lang="ts">
// 对齐 antd 的 demo/placement.tsx

import { Button, Tooltip } from '@apollo-design/ui';

const rows: Array<Array<[string, string]>> = [
  [
    ['topLeft', 'TL'],
    ['top', 'Top'],
    ['topRight', 'TR'],
  ],
  [
    ['leftTop', 'LT'],
    ['left', 'Left'],
    ['leftBottom', 'LB'],
  ],
  [
    ['rightTop', 'RT'],
    ['right', 'Right'],
    ['rightBottom', 'RB'],
  ],
  [
    ['bottomLeft', 'BL'],
    ['bottom', 'Bottom'],
    ['bottomRight', 'BR'],
  ],
];

const buttonWidth = 80;
</script>

<template>
  <div
    style="font-family: sans-serif; width: 480px; margin: 0 auto; display: flex; flex-direction: column; row-gap: 8px"
  >
    <template v-for="(row, i) in rows" :key="i">
      <div
        :style="{
          display: 'flex',
          justifyContent: i === 1 ? 'flex-start' : i === 2 ? 'flex-end' : 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
        }"
      >
        <Tooltip v-for="[p, label] in row" :key="p" :title="p" :placement="p as never">
          <Button :style="{ width: buttonWidth + 'px', margin: '4px' }">{{ label }}</Button>
        </Tooltip>
      </div>
    </template>
  </div>
</template>
