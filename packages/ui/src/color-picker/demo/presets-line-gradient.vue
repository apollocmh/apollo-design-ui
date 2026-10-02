<script setup lang="ts">
// 对齐 antd 的 presets-line-gradient demo：预设**渐变色**。
import type { LineGradientType, PresetsItem } from '@apollo-design/ui';
import { ColorPicker } from '@apollo-design/ui';

/** 每项是一组「起点色 / 终点色」。显式元组类型 ⇒ 解构出的两端不是 `undefined`。 */
const PRESET_COLORS: [string, string][] = [
  ['rgb(42, 188, 191)', 'rgb(56, 54, 221)'],
  ['rgb(34, 73, 254)', 'rgb(199, 74, 168)'],
  ['rgb(255, 111, 4)', 'rgb(243, 48, 171)'],
  ['rgb(244, 170, 6)', 'rgb(229, 70, 49)'],
];

const presets: PresetsItem[] = [
  {
    label: 'Liner',
    colors: PRESET_COLORS.map(
      ([start, end]): LineGradientType => [
        { color: start, percent: 0 },
        { color: end, percent: 100 },
      ],
    ),
    defaultOpen: true,
  },
];
</script>

<template>
  <ColorPicker :mode="['single', 'gradient']" :presets="presets" />
</template>
