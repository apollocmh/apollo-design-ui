<script setup lang="ts">
// 对齐 antd 的 demo/cell-render.tsx：自定义单元格内容
import { DatePicker, type DatePickerSlots } from '@apollo-design/ui';
import { h } from 'vue';

const cellRender: NonNullable<DatePickerSlots['cellRender']> = ({ current, info }) => {
  if (info.type !== 'date' || typeof current !== 'object' || current === null) {
    return info.originNode;
  }
  const day = current.date();
  if (day % 7 !== 0) return info.originNode;
  return h('div', { style: { position: 'relative' } }, [
    info.originNode,
    h('span', {
      style: {
        position: 'absolute',
        insetInlineEnd: '2px',
        bottom: '2px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--apollo-color-primary)',
      },
    }),
  ]);
};
</script>

<template>
  <DatePicker placeholder="每 7 天有一个圆点">
    <template #cellRender="scope"><component :is="() => cellRender(scope)" /></template>
  </DatePicker>
</template>
