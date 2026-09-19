<script setup lang="ts">
import { h, type VNodeChild } from 'vue';
import { Space } from '../../index';
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
