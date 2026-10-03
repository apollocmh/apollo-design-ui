<script setup lang="ts">
// 对齐 antd demo/style-class.tsx
// ⚠️ demo 级替换：antd 用 `antd-style` 的 `createStyles` 生成类名 ⇒ 本仓改用
//    等价的**静态类名**（`classNames`）+ 组件自带的 `styles`（见 README §5）。

import type { MentionsProps } from '@apollo-design/ui';
import { Flex, Mentions } from '@apollo-design/ui';

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'meet-student', label: 'meet-student' },
  { value: 'thinkasany', label: 'thinkasany' },
];

/** 等值替换 antd 的 `useStyles()` 产物（`{ root: 300px 宽 + 主色边框 }`）。 */
const classNames = {
  root: 'mentions-style-class-root',
};

const stylesObject: MentionsProps['styles'] = {
  textarea: {
    fontSize: '14px',
    resize: 'vertical',
    fontWeight: 200,
  },
};

const stylesFunction: MentionsProps['styles'] = (info) => {
  if (info.props.variant === 'filled') {
    return {
      root: { border: '1px solid #722ed1' },
      popup: { border: '1px solid #722ed1' },
    };
  }
  return {};
};
</script>

<template>
  <Flex vertical gap="medium">
    <Mentions :class-names="classNames" :options="options" :styles="stylesObject" placeholder="Object" :rows="2" />
    <Mentions :options="options" :styles="stylesFunction" variant="filled" placeholder="Function" />
  </Flex>
</template>

<style scoped>
.mentions-style-class-root {
  width: 300px;
  border: 1px solid #1677ff;
  border-radius: 8px;
}
</style>
