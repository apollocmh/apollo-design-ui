# @apollo-design/theme

Apollo Design 的设计令牌、主题预设和 Vue 主题上下文。支持 Seed → Map → Alias 派生、CSS 变量、局部主题，以及 Default、Mono、Material 三套预设的亮暗外观。

[主题预览](https://apollocmh.github.io/apollo-design-ui/guide/themes) · [主题指南](https://apollocmh.github.io/apollo-design-ui/guide/theming)

## 安装

```bash
npm install @apollo-design/theme vue
```

配合 UI 组件使用时，同时安装 `@apollo-design/ui`。

## 默认样式

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

`tokens.css` 提供默认变量，以及 `data-apollo-theme="dark"`、`compact`、`dark-compact` 对应的变量。UI 的静态规则消费这些 CSS 变量。

## 选择预设与外观

```vue
<script setup lang="ts">
import { Button, ConfigProvider } from '@apollo-design/ui';
import { material3Preset } from '@apollo-design/theme/presets/material3';
</script>

<template>
  <ConfigProvider :theme="{ preset: material3Preset, mode: 'system' }">
    <Button type="primary">跟随系统外观</Button>
  </ConfigProvider>
</template>
```

| 预设 | JavaScript 入口 | 可选静态 CSS |
| --- | --- | --- |
| Default | `@apollo-design/theme/presets/default` | `@apollo-design/theme/presets/default.css` |
| Mono | `@apollo-design/theme/presets/mono` | `@apollo-design/theme/presets/mono.css` |
| Material | `@apollo-design/theme/presets/material3` | `@apollo-design/theme/presets/material3.css` |

具名导出分别为 `defaultPreset`、`monoPreset`、`material3Preset`，各入口也有默认导出。预设通过独立入口导入；Material 的品牌色 Seed 为 `#0073E6`。`mode` 支持 `light`、`dark`、`system`，与预设选择独立。

使用预设静态 CSS 时，在变量根配置 `data-apollo-preset="material3"` 与 `data-apollo-theme="light|dark|system"`。它适合首屏/SSR 样式；需要响应式组件令牌时，Provider 应使用同一预设和外观。显式主题 Provider 会投影变量，仍需引入 UI 结构 CSS。

## 自定义令牌

```ts
import { getDesignToken, type ThemePreset } from '@apollo-design/theme';

const brand: ThemePreset = {
  name: 'brand',
  token: { borderRadius: 6 },
  light: { token: { colorPrimary: '#0073e6' } },
  dark: { token: { colorPrimary: '#4096ff' } },
};
const tokens = getDesignToken({ preset: brand, mode: 'dark', token: { fontSize: 16 } });
console.log(tokens.colorPrimary);
```

预设基础值、亮暗分支和用户覆盖依次参与派生；主色、字号等 Seed 会影响关联令牌。`defaultAlgorithm`、`darkAlgorithm`、`compactAlgorithm` 支持算法组合，`components` 的组件级配置由 UI 消费。

`getDesignToken` 的系统模式在没有明确环境时按亮色确定性派生，可通过第二参数传入已知的 `'light'` / `'dark'`。Vue Provider 挂载后监听系统偏好并随卸载清理。颜色输入使用具体色值（如 hex、rgb、hsl），不把 `var()`、颜色名称或 `color-mix()` 当作派生输入。

## 自定义宿主与 SSR

`ThemeProvider`、`useTheme`、`useToken`、`createThemeContext` 面向需要独立主题上下文的组件作者。`ThemeProvider` 的 `inject-css-var` 可把变量注入其根；应用组件配置优先使用 UI 的 `ConfigProvider`。

`getCSSVarDeclarations(getDesignToken(...))` 可在构建或 SSR 阶段生成变量声明。DOM 注入和作用域 API 在客户端实际目标上使用，并按返回的释放接口清理。避免用模块级可变主题承载不同 SSR 请求。

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/theme/src/index.ts) · [样式指南](https://apollocmh.github.io/apollo-design-ui/guide/styles) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md)
