const o=`<script setup lang="ts">
// 对齐 antd 的 line-gradient demo：用 \`mode\` 切换单色 / 渐变色。
import type { ColorPickerColor } from '@apollo-design/ui';
import { ColorPicker, Space } from '@apollo-design/ui';

/** 上游 \`Color\`（= \`AggregationColor\`）：ui barrel 未导出该别名，从 \`change\` 的载荷反推。 */
type Color = ColorPickerColor;

const DEFAULT_COLOR = [
  { color: 'rgb(16, 142, 233)', percent: 0 },
  { color: 'rgb(135, 208, 104)', percent: 100 },
];

// 上游在 \`onChangeComplete\` 里 \`console.log(color.toCssString())\` —— 本仓同。
const onChangeComplete = (color: Color) => {
  console.log(color.toCssString());
};
<\/script>

<template>
  <Space vertical>
    <ColorPicker
      :default-value="DEFAULT_COLOR"
      allow-clear
      show-text
      :mode="['single', 'gradient']"
      @change-complete="onChangeComplete"
    />
    <ColorPicker
      :default-value="DEFAULT_COLOR"
      allow-clear
      show-text
      mode="gradient"
      @change-complete="onChangeComplete"
    />
  </Space>
</template>
`;export{o as default};
