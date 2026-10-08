const n=`<script setup lang="ts">
// 对齐 antd 的 presets demo：预设颜色分组。
//
// ⚠️ **两处 demo 级替换**（不是能力缺口）：
//   1. 上游用 \`theme.useToken()\` 取 \`colorPrimary\` —— 本仓是**零运行时**架构，没有这个
//      hook ⇒ 写**等值字面量** \`#1677ff\`（默认主题的 \`colorPrimary\` 解析值）。
//   2. 上游用 \`@ant-design/colors\` 的 \`generate\` / \`red\` / \`green\` —— 本仓没有该依赖
//      ⇒ 把对应色板**固化成字面量**（值来自 \`@ant-design/colors@8.0.1\`，逐位一致）。
import type { PresetsItem } from '@apollo-design/ui';
import { ColorPicker } from '@apollo-design/ui';

/** \`generate('#1677ff')\`（\`token.colorPrimary\` 的默认值）的 10 档色板。 */
const PRIMARY_PALETTE = [
  '#e6f4ff',
  '#bae0ff',
  '#91caff',
  '#69b1ff',
  '#4096ff',
  '#1677ff',
  '#0958d9',
  '#003eb3',
  '#002c8c',
  '#001d66',
];

/** \`@ant-design/colors\` 的 \`red\`。 */
const RED_PALETTE = [
  '#fff1f0',
  '#ffccc7',
  '#ffa39e',
  '#ff7875',
  '#ff4d4f',
  '#f5222d',
  '#cf1322',
  '#a8071a',
  '#820014',
  '#5c0011',
];

/** \`@ant-design/colors\` 的 \`green\`。 */
const GREEN_PALETTE = [
  '#f6ffed',
  '#d9f7be',
  '#b7eb8f',
  '#95de64',
  '#73d13d',
  '#52c41a',
  '#389e0d',
  '#237804',
  '#135200',
  '#092b00',
];

/** 上游 \`genPresets\`：把色板表折成 \`{ label, colors, key }\` 数组。 */
const genPresets = (palettes: Record<string, string[]>): PresetsItem[] =>
  Object.entries(palettes).map(([label, colors]) => ({ label, colors, key: label }));

const presets = genPresets({ primary: PRIMARY_PALETTE, red: RED_PALETTE, green: GREEN_PALETTE });
<\/script>

<template>
  <ColorPicker :presets="presets" default-value="#1677ff" />
</template>
`;export{n as default};
