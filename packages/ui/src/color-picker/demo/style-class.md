---
order: 14
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Style Class
---

`classNames` / `styles` 可传对象或函数，用来定制 5 个语义槽的类名与样式。

```vue
<script setup lang="ts">
// 对齐 antd 的 style-class demo：`classNames` / `styles` 的**对象 / 函数**两种形态。
//
// ⚠️ **一处 demo 级替换**：上游用 `antd-style` 的 `createStyles`（第三方 CSS-in-JS）生成
//    类名 —— 本仓是**零运行时**架构，没有 CSS-in-JS ⇒ 用 SFC 的 `<style>` 块定义同名类名
//    （效果等价：`classNames.root` 拿到一个带 `border-radius` 的类）。`token.borderRadius`
//    的默认解析值是 `6px`。
import type { ColorPickerProps } from '@apollo-design/ui';
import { ColorPicker, Flex, Space } from '@apollo-design/ui';

/** 上游 `useStyles()` 的产物：`styles.root` 是一个生成的类名。 */
const classNames = { root: 'demo-color-picker-root' };

/** 对象形态：`styles.popup.root` 直接给值。 */
const stylesObject: ColorPickerProps['styles'] = {
  popup: {
    root: {
      border: '1px solid #fff',
    },
  },
};

/**
 * 函数形态：按 `info.props.size` 决定返回什么。
 * ⚠️ 上游这里 `return {}`（不是 `undefined`）—— 本仓 `ColorPickerSemanticValue` 的函数分支
 *    要求返回 `T`（与上游 `GenerateSemantic` 同形），空对象 = 不加任何样式，效果等价。
 */
const stylesFn: ColorPickerProps['styles'] = (info) => {
  if (info.props.size === 'large') {
    return {
      popup: {
        root: {
          border: '1px solid #722ed1',
        },
      },
    };
  }
  return {};
};
</script>

<template>
  <Space :size="[8, 16]" wrap>
    <Flex gap="small">
      <ColorPicker
        default-value="#1677ff"
        :arrow="false"
        :styles="stylesObject"
        :class-names="classNames"
      />
    </Flex>
    <Flex gap="small">
      <ColorPicker
        default-value="#722ed1"
        size="large"
        :styles="stylesFn"
        :arrow="false"
        :class-names="classNames"
      />
    </Flex>
  </Space>
</template>

<style>
.demo-color-picker-root {
  border-radius: 6px;
}
</style>
```
