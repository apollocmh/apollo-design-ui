---
title:
  zh-CN: 主题
  en-US: Theming
order: 4
---

## zh-CN

主题定制有三层，按需选用：

### 1. 直接改 CSS 变量（零运行时）

所有组件样式都消费 `--apollo-*` 变量，覆盖即生效：

```css
:root {
  --apollo-color-primary: #6455ff;
  --apollo-border-radius: 10px;
}
```

### 2. `ThemeProvider`（运行时派生）

`@apollo-design/theme` 提供基于种子令牌的派生算法（对齐 antd 的 seed → map → alias 链路）与 Vue 绑定层：

```vue
<script setup lang="ts">
import { ThemeProvider } from '@apollo-design/theme';
</script>

<template>
  <ThemeProvider :theme="{ token: { colorPrimary: '#6455ff' } }">
    <App />
  </ThemeProvider>
</template>
```

相关 API：`ThemeProvider` / `useTheme()` / `useToken()` / `injectTokenCssVar()`。

### 3. 亮 / 暗切换

暗色是令牌作用域切换（见[样式引入](/guide/styles)），组件无需重新挂载。本文档站右上角的开关就是这样实现的，示例与官网同步切换。

### 站点令牌与组件令牌

官网自身视觉走独立的 `--site-*` 令牌体系；组件示例永远运行在组件库令牌作用域内 —— 站点换肤不会改变组件视觉，反之亦然。

## en-US

Theming has three layers: (1) override `--apollo-*` CSS variables directly (zero runtime); (2) use `ThemeProvider` from `@apollo-design/theme` for seed-token derivation (`useTheme()` / `useToken()` / `injectTokenCssVar()`); (3) toggle dark mode via the `[data-apollo-theme="dark"]` attribute scope — components don't need to remount. This site's theme switch works exactly that way.
