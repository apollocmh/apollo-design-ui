const n=`<script setup lang="ts">
// 对齐 antd 的 radiogroup demo（图标 + 垂直排列的标签内容）
import {
  BarChartOutlined,
  DotChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@apollo-design/icons';
import { Flex, Radio } from '@apollo-design/ui';
import { type Component, h, ref } from 'vue';

const value = ref(1);

/** 与 antd 的 \`label: <Flex vertical gap="small" justify="center" align="center">…</Flex>\` 同构。 */
const chartLabel = (Icon: Component, text: string) =>
  h(
    Flex,
    { gap: 'small', justify: 'center', align: 'center', vertical: true },
    { default: () => [h(Icon, { style: { fontSize: '18px' } }), text] },
  );

const options = [
  { value: 1, className: 'option-1', label: chartLabel(LineChartOutlined, 'LineChart') },
  { value: 2, className: 'option-2', label: chartLabel(DotChartOutlined, 'DotChart') },
  { value: 3, className: 'option-3', label: chartLabel(BarChartOutlined, 'BarChart') },
  { value: 4, className: 'option-4', label: chartLabel(PieChartOutlined, 'PieChart') },
];
<\/script>

<template>
  <Radio.Group v-model:value="value" :options="options" />
</template>
`;export{n as default};
