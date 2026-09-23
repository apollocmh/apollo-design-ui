<script setup lang="ts">
// 对齐 antd 的 text demo（四种 children 形态）
import { CheckOutlined, CloseOutlined, FrownOutlined, SmileOutlined } from '@apollo-design/icons';
import { Flex, Switch } from '@apollo-design/ui';
// ⚠️ `Icon` 的类型要用 Vue 的 `Component`，**不要**写 `typeof SmileOutlined` ——
//    biome 的 import 整理会把「脚本里只出现在类型位置」的导入改成 `type` 导入，
//    而模板里它是**当值用**的 ⇒ 运行时报 `Property "SmileOutlined" … is not defined
//    on instance`（demo 冒烟抓到的，PITFALLS 163）。
import { type Component, h } from 'vue';

/** 图标 + 文字的组合（antd 的 `label: <Flex gap={4} align="center">…</Flex>`）。 */
const iconLabel = (Icon: Component, text: string) =>
  h(
    Flex,
    { gap: 4, justify: 'flex-start', align: 'center' },
    {
      default: () => [h(Icon), text],
    },
  );
</script>

<template>
  <Flex vertical gap="medium" align="flex-start" justify="flex-start">
    <Switch checked-children="On" un-checked-children="Off" default-checked />
    <Switch :checked-children="1" :un-checked-children="0" default-checked />
    <Switch
      default-checked
      :checked-children="h(CheckOutlined)"
      :un-checked-children="h(CloseOutlined)"
    />
    <Switch
      default-checked
      :checked-children="iconLabel(SmileOutlined, 'Happy')"
      :un-checked-children="iconLabel(FrownOutlined, 'Sad')"
    />
  </Flex>
</template>
