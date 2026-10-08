const e=`<script setup lang="ts">
// 对齐 antd 的 text demo（四种 children 形态）
// C8-R2：文本走 prop，图标/富内容走 #checkedChildren / #unCheckedChildren 插槽
import { CheckOutlined, CloseOutlined, FrownOutlined, SmileOutlined } from '@apollo-design/icons';
import { Flex, Switch } from '@apollo-design/ui';
import { type Component, defineComponent, h } from 'vue';

/** 图标 + 文字的组合（antd 的 \`label: <Flex gap={4} align="center">…</Flex>\`）。 */
const iconLabel = (Icon: Component, text: string) =>
  h(
    Flex,
    { gap: 4, justify: 'flex-start', align: 'center' },
    {
      default: () => [h(Icon), text],
    },
  );

/** 插槽内容是 VNode —— 模板插值 \`{{ }}\` 会转字符串，用函数式组件承载。 */
const HappyLabel = defineComponent({ setup: () => () => iconLabel(SmileOutlined, 'Happy') });
const SadLabel = defineComponent({ setup: () => () => iconLabel(FrownOutlined, 'Sad') });
<\/script>

<template>
  <Flex vertical gap="medium" align="flex-start" justify="flex-start">
    <Switch checked-children="On" un-checked-children="Off" default-checked />
    <Switch default-checked>
      <template #checkedChildren>1</template>
      <template #unCheckedChildren>0</template>
    </Switch>
    <Switch default-checked>
      <template #checkedChildren><CheckOutlined /></template>
      <template #unCheckedChildren><CloseOutlined /></template>
    </Switch>
    <Switch default-checked>
      <template #checkedChildren><HappyLabel /></template>
      <template #unCheckedChildren><SadLabel /></template>
    </Switch>
  </Flex>
</template>
`;export{e as default};
