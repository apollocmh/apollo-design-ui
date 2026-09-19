<script setup lang="ts">
/**
 * `theme` —— 零运行时 CSS 变量方案的落地点（`ARCHITECTURE.md` §5.2）。
 *
 * `ConfigProvider` 用 `theme` 包算出完整 token，再把 `--apollo-*` 写到**作用域元素**
 * 的内联样式上。下面这个盒子的背景色直接 `var(--apollo-color-primary)`，
 * 所以它跟着 `theme` 变 —— 不需要任何运行时样式注入。
 */
import { ConfigProvider } from '../../index';

const boxStyle = {
  width: '96px',
  height: '96px',
  borderRadius: 'var(--apollo-border-radius)',
  background: 'var(--apollo-color-primary)',
};
</script>

<template>
  <ConfigProvider :theme="{ token: { colorPrimary: '#00b96b' } }">
    <div :style="boxStyle" />
  </ConfigProvider>
</template>
