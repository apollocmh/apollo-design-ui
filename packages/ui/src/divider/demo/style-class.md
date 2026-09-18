---
order: 8
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Style & Class
---

`classNames` / `styles` 各有三个槽位：`root` / `rail` / `content`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。

函数式拿到的 `info.props` 是**合并后**的 props —— `titlePlacement` 已折成 `start` / `end`、
`orientation` 已合并成 `horizontal` / `vertical`、`size` 已并入 ConfigProvider 的取值。
所以可以用它做条件分支。

⚠️ `rail` 槽位在**没有 children** 时落在**根元素**上（不是子元素）；有 children 时落在两个
rail 子元素上。这是上游行为，不是笔误。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
import type { DividerProps } from '@apollo-design/ui';

const classNamesObject: DividerProps['classNames'] = {
  root: 'demo-divider-root',
  content: 'demo-divider-content',
  rail: 'demo-divider-rail',
};

const classNamesFn: DividerProps['classNames'] = (info) =>
  info.props.titlePlacement === 'start'
    ? { root: 'demo-divider-root--start' }
    : { root: 'demo-divider-root--default' };

const stylesObject: DividerProps['styles'] = {
  root: { borderWidth: '2px', borderStyle: 'dashed' },
  content: { fontStyle: 'italic' },
  rail: { opacity: 0.85 },
};

const stylesFn: DividerProps['styles'] = (info) =>
  info.props.size === 'small'
    ? { root: { opacity: 0.6, cursor: 'default' } }
    : { root: { backgroundColor: '#fafafa', borderColor: '#d9d9d9' } };
</script>

<template>
  <div>
    <Divider :class-names="classNamesObject">classNames Object</Divider>
    <Divider title-placement="start" :class-names="classNamesFn">classNames Function</Divider>
    <Divider :styles="stylesObject">styles Object</Divider>
    <Divider size="small" :styles="stylesFn">styles Function</Divider>
  </div>
</template>
```
