---
order: 6
title:
  zh-CN: 语义化样式
  en-US: Style Class
---

通过 `classNames` 和 `styles` 传入对象/函数可以自定义 Calendar 的语义化结构样式。

```vue
<script setup lang="ts">
// 对齐 antd 的 style-class demo：`classNames` 与 `styles` 的**对象 / 函数**两种形态。
//
// ⚠️ **一处 demo 级替换**：上游用 `antd-style` 的 `createStyles` 生成类名 ——
//    本仓是**零运行时**架构，没有 CSS-in-JS ⇒ 用 SFC 的 `<style>` 块定义同名类名
//    （效果等价：`classNames.root` 拿到一个带 `padding` + 背景色的类）。

import type { CalendarProps } from '@apollo-design/ui';
import { Calendar, Flex } from '@apollo-design/ui';

/** 对象形态：`borderRadius` / `width` 直接给值。 */
const stylesObject: CalendarProps['styles'] = {
  root: {
    borderRadius: 8,
    width: 600,
  },
};

/**
 * 函数形态：按 `info.props` 决定返回什么。
 * ⚠️ `info.props.fullscreen` 是**解析后**的值（未传 ⇒ `true`）——
 *    与上游 `{...props, mode, fullscreen, showWeek}` 的语义一致（`mode` 保持原始 prop）。
 */
const stylesFunction: CalendarProps['styles'] = (info) => {
  if (info.props.fullscreen) {
    return {
      root: {
        border: '2px solid #BDE3C3',
        borderRadius: 10,
        backgroundColor: 'rgba(189,227,195, 0.3)',
      },
    };
  }
  // ⚠️ 上游这里 `return undefined` —— 本仓的 `CalendarSemanticValue` 函数分支要求返回
  //    `T`（与上游 `GenerateSemantic` 同形），**不收 `undefined`** ⇒ 返回空对象。
  //    效果等价（6 个槽全可选，空对象 = 不加任何样式）。见 README §5 第 5 条。
  return {};
};
</script>

<template>
  <Flex gap="medium" vertical>
    <Calendar :fullscreen="false" :class-names="{ root: 'calendar-root' }" :styles="stylesObject" />
    <Calendar :class-names="{ root: 'calendar-root' }" :styles="stylesFunction" />
  </Flex>
</template>

<style>
.calendar-root {
  padding: 10px;
  background-color: #e6f4ff;
}
</style>
```
