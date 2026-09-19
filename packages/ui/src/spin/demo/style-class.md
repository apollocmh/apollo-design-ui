---
order: 7
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Custom semantic dom styling
---

`classNames` / `styles` 各有 6 个槽位：`root` / `section` / `indicator` / `description` /
`container`，外加两个已废弃的 `tip` / `mask`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。

⚠️ 三条槽位落点的分叉（照抄上游，不是笔误）：

- **非嵌套**（无 children 且非 `fullscreen`）时根元素自己就是 section，
  所以 `classNames.section` / `styles.section` 落在**根元素**上；
- **嵌套**时 `-section` 下移到内层 div，根元素改吃已废弃的 `wrapperClassName`；
- `styles.mask` 只在 `fullscreen` 时并入根元素，`styles.tip` 与 `styles.description`
  一起并入文案块（`description` 后写、覆盖 `tip`）。

函数式拿到的 `info.props` 是**合并后**的 props —— `description` 已折成 `description ?? tip`
的结果、`percent` 是 `auto` 解析后的数值，所以可以用它做条件分支。

```vue
<script setup lang="ts">
import { Spin } from '@apollo-design/ui';
import type { SpinProps } from '@apollo-design/ui';

const classNamesObject: SpinProps['classNames'] = {
  root: 'demo-spin-root',
  indicator: 'demo-spin-indicator',
};

const stylesObject: SpinProps['styles'] = {
  indicator: { color: '#00d4ff' },
};

const stylesFn: SpinProps['styles'] = (info) =>
  info.props.size === 'small' ? { indicator: { color: '#722ed1' } } : {};
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center', gap: '16px' }">
    <Spin spinning :percent="0" :class-names="classNamesObject" :styles="stylesObject" />
    <Spin spinning :percent="0" size="small" :styles="stylesFn" />
  </div>
</template>
```
