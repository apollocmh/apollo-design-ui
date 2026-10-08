const o=`<script setup lang="ts">
// 对齐 antd 的 controlled demo：两个受控 ColorPicker 共享同一份颜色状态。
// 第一个由 \`onChange\` 驱动（拖拽中实时同步），第二个由 \`onChangeComplete\` 驱动
// （拖拽结束才同步 ⇒ 视觉上「锁住」展示色）。
import type { ColorPickerColor, ColorValueType } from '@apollo-design/ui';
import { ColorPicker, Space } from '@apollo-design/ui';
import { ref } from 'vue';

/** 上游 \`Color\`（= \`AggregationColor\`）：ui barrel 未导出该别名，从 \`change\` 的载荷反推。 */
type Color = ColorPickerColor;

const color = ref<ColorValueType>('#1677ff');

const onChange = (c: Color) => {
  color.value = c;
};

const onChangeComplete = (c: Color) => {
  color.value = c;
};
<\/script>

<template>
  <Space>
    <ColorPicker :value="color" @change="onChange" />
    <ColorPicker :value="color" @change-complete="onChangeComplete" />
  </Space>
</template>
`;export{o as default};
