<script setup lang="ts">
// 对齐 antd demo/arrow.tsx（箭头三态：Show / Hide / Center）。

import type { TooltipPlacement } from '@apollo-design/ui';
import { Button, Popover, Segmented } from '@apollo-design/ui';
import { ref } from 'vue';

const text = 'Title';
const arrowMode = ref<'Show' | 'Hide' | 'Center'>('Show');
const btnStyle = { width: '80px' };

const rows: TooltipPlacement[][] = [
  ['topLeft', 'top', 'topRight'],
  ['leftTop', 'left', 'leftBottom', 'rightTop', 'right', 'rightBottom'],
  ['bottomLeft', 'bottom', 'bottomRight'],
];
const mergedArrow = () => {
  if (arrowMode.value === 'Hide') return false;
  if (arrowMode.value === 'Center') return { pointAtCenter: true };
  return true;
};
</script>

<template>
  <div>
    <Segmented v-model:value="arrowMode" :options="['Show', 'Hide', 'Center']" aria-label="arrow mode" style="margin-bottom: 24px" />
    <div style="display: flex; flex-direction: column; align-items: center; row-gap: 16px">
      <div v-for="(row, i) in rows" :key="i" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px">
        <Popover v-for="p in row" :key="p" :placement="p" :title="text" :arrow="mergedArrow()">
          <template #content>
            <p>Content</p>
            <p>Content</p>
          </template>
          <Button :style="btnStyle">{{ p }}</Button>
        </Popover>
      </div>
    </div>
  </div>
</template>
