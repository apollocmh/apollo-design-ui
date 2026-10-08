const o=`<script setup lang="ts">
// 对齐 antd 的 text-render demo：\`showText\` 的布尔 / 函数两种形态。
//
// ⚠️ **一处 demo 级替换**：上游用 \`@ant-design/icons\` 的 \`DownOutlined\` —— 本仓用
//    \`@apollo-design/icons\` 的同名图标（API 同形，\`rotate\` / \`style\` 都支持）。
import { DownOutlined } from '@apollo-design/icons';
import type { ColorPickerColor } from '@apollo-design/ui';
import { ColorPicker, Space } from '@apollo-design/ui';
import { h, ref } from 'vue';

/** 上游 \`Color\`（= \`AggregationColor\`）：ui barrel 未导出该别名，从 \`change\` 的载荷反推。 */
type Color = ColorPickerColor;

const open = ref(false);

/** \`showText\` 的函数形态：返回自定义文本。 */
const customText = (color: Color) => h('span', null, \`Custom Text (\${color.toHexString()})\`);

/** 返回一个随开合翻转的箭头。 */
const arrowText = () =>
  h(DownOutlined, {
    rotate: open.value ? 180 : 0,
    style: { color: 'rgba(0, 0, 0, 0.25)' },
  });
<\/script>

<template>
  <Space vertical>
    <ColorPicker default-value="#1677ff" show-text allow-clear />
    <ColorPicker default-value="#1677ff" :show-text="customText" />
    <ColorPicker v-model:open="open" default-value="#1677ff" :show-text="arrowText" />
  </Space>
</template>
`;export{o as default};
