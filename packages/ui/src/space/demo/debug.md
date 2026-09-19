---
order: 11
title:
  zh-CN: 假值子节点
  en-US: Debug
---

假值子节点不会破坏布局。

⚠️ 这个 demo 用 `h()` 而不是模板插值，**这不是风格问题**：
在 Vue 模板里 `{{ null }}` 会退化成空文本节点、`{{ false }}` 会渲染出字符串 `"false"`
（`toDisplayString` 的语义），与 React 的 vnode 语义不等价。
用 `h()` 才能与 antd 的 JSX 子节点逐字对应。

`null` / `undefined` / `false` 会被 `toArray(children, { keepEmpty: true })` 保留成占位，
再由 `isEmptyVNode` 判定为空 ⇒ **不产生** `-item`；数字 `1` 是有效节点 ⇒ 产生 `-item`。

```vue
<script setup lang="ts">
import { h, type VNodeChild } from 'vue';
import { Space } from '@apollo-design/ui';
import { BTN_DEFAULT } from './_standin';

/**
 * ⚠️ 这个 demo 必须用 `h()` 而不是模板插值。
 *
 * antd 的 `debug.tsx` 演示的是「**假值子节点**不会破坏 Space」：
 * `{null}` / `{false}` / `{undefined}` 与「裸文本」混在一起。
 * 在 Vue 模板里写 `{{ null }}` 会退化成空文本节点、写 `{{ false }}` 会渲染出字符串
 * `"false"`（`toDisplayString` 的语义）—— **与 React 的 vnode 语义不等价**，
 * 于是这个 demo 就不再是在演示它要演示的东西。
 *
 * 用 `h()` 直接构造 vnode 数组，语义与 antd 的 JSX 子节点逐字对应。
 */
const items: VNodeChild[] = [
  'Button',
  h('button', { type: 'button', style: BTN_DEFAULT }, 'Button'),
  'Button',
  h('button', { type: 'button', style: BTN_DEFAULT }, 'Delete'),
  h('button', { type: 'button', style: BTN_DEFAULT, disabled: true }, 'Delete'),
  null,
  false,
  1,
  'Button',
  null,
  undefined,
];

const Demo = () => h(Space, null, { default: () => items });
</script>

<template>
  <component :is="Demo" />
</template>
```
