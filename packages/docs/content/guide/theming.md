---
title:
  zh-CN: 主题
  en-US: Theming
order: 4
---

## zh-CN

[打开主题展示](/guide/themes)，在同一页比较三套主题的亮暗外观。

### 风格与明暗独立选择

默认、Mono 与 Material 风格通过相同公开 API 派生。Mono 使用黑白灰、克制圆角与阴影，并保留语义色；Material 参考 MUI 的中性表面、4px 默认圆角与层级阴影，保留 Apollo 的组件交互规范。公开入口仍为 `material3`，可在[主题展示](/guide/themes)中比较亮暗效果。

```vue
<script setup lang="ts">
import { ConfigProvider, Button } from '@apollo-design/ui';
import { monoPreset } from '@apollo-design/theme/presets/mono';

const theme = {
  preset: monoPreset,
  mode: 'system' as const,
  token: { colorPrimary: '#6455ff', borderRadius: 8 },
  components: { Button: { paddingInline: 20 } },
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <Button type="primary">自定义 Mono</Button>
  </ConfigProvider>
</template>
```

独立入口分别是 `@apollo-design/theme/presets/default`、`/mono`、`/material3`，具名导出为 `defaultPreset`、`monoPreset`、`material3Preset`，同时提供默认导出。根入口只导出类型与派生服务，不加载全部预设。自定义预设使用公开 `ThemePreset` 数据结构，无需向 resolver 注册。

`ThemeConfig.mode` 支持 `light | dark | system`。实时 Provider 在挂载后响应系统偏好并释放监听；纯函数 `getDesignToken(config, systemAppearance?)` 与 SSR 缺省按 light 派生，服务端已知偏好时可传第二个参数 `'dark'`。

### 覆盖顺序与嵌套边界

派生顺序为：默认种子 → 预设公共 Token → 所选明暗方案 → 用户种子覆盖并派生 → 用户 Map/Alias 最终覆盖。组件 Token 在组件作用域覆盖相应默认值。局部显式 `algorithm` 优先于继承的 `mode`；局部显式 `mode` 优先于继承的 `algorithm`。因此演示局部暗色算法的 Demo 仍保留自己的意图。

`ConfigProvider` 默认继承父级原始主题配置，`theme.inherit: false` 重置继承。独立 `ThemeProvider` 保留原有默认重置语义；要合并父级，请显式设置 `theme.inherit: true`。两者都在原始配置层合并，避免把父级派生后的颜色当成下一层种子。并排 Provider、嵌套 Provider、所属 Portal 和通过 App/上下文 API 创建的 Message/Notification 保持各自主题边界。

```vue
<ConfigProvider :theme="{ preset: monoPreset, mode: 'dark' }">
  <Button>继承 Mono 暗色</Button>
  <ConfigProvider :theme="{ token: { borderRadius: 12 } }">
    <Button>继承配色，仅覆盖圆角</Button>
  </ConfigProvider>
</ConfigProvider>
```

### 静态资源与三种引入方式

JS、组件结构 CSS 与主题选择彼此独立。参见[样式引入](/guide/styles)中的自动按需、手工子路径、全量三种入口及加载顺序。Provider 会在已有组件作用域更新 CSS 变量，不重挂组件；静态 CSS 仍需显式引入。

也可使用可选 `@apollo-design/theme/presets/default.css`、`/mono.css`、`/material3.css`。每份由同一 `getDesignToken` 公开 API 生成，含 light/dark/system 选择器，不引用另一份预设。选择器示例：

```html
<html data-apollo-preset="mono" data-apollo-theme="system">
```

自行覆盖原生 CSS 变量无需运行时，但种子变量的覆盖不会自动重算整套派生色阶；需要派生时使用 Provider 或 `getDesignToken`。同时设置前景与背景，避免暗色文字落在浅色背景上。

### 文档站实时预览

Header 的主题面板分别提供默认/Mono/Material 与浅色/深色/跟随系统。选择保存在本机，换页和刷新保留，首屏先设置同一公开属性选择器再加载样式；SSR 保留确定的默认结构，挂载后接入客户端选择。站点 `--site-*` 只引用组件公开 Token，不维护第二套调色板。

内联 Demo 继承站点选择，但其局部 Provider 可覆盖。独立链接携带初始 `preset`、`theme`、`lang`。iframe 在客户端首次创建时携带当前选择，后续以验证 origin、source、frameId 的受控消息更新，不改写 src，不丢失输入、选择与展开状态。文档站为了提供三个可选风格显式加载三份预设 CSS；只用一个风格的应用只需加载自己的入口。

## en-US

[Open the theme gallery](/guide/themes) to compare all three themes in light and dark.

### Independent style and appearance

Default, Mono and Material presets use the same public `ThemePreset` and `ThemeConfig` API. Material references MUI’s neutral surfaces, 4px default corners and elevation shadows while retaining Apollo’s component interactions. Compare light and dark appearances in the [theme gallery](/guide/themes). Import `defaultPreset`, `monoPreset` or `material3Preset` from the independent `@apollo-design/theme/presets/default`, `/mono` or `/material3` entry. Each also has a default export. The root entry does not load every preset. Custom presets do not require resolver registration.

```ts
import { monoPreset } from '@apollo-design/theme/presets/mono';
const theme = {
  preset: monoPreset,
  mode: 'system' as const,
  token: { colorPrimary: '#6455ff', borderRadius: 8 },
  components: { Button: { paddingInline: 20 } },
};
```

Pass this configuration to `ConfigProvider`. `mode` accepts `light | dark | system`. Live providers subscribe to system appearance after mounting and release their subscription. Pure `getDesignToken(config, systemAppearance?)` and SSR default to light; pass `'dark'` as the second argument when the server knows the preference.

### Precedence and scope

Derivation applies default seeds, common preset tokens, the selected appearance scheme, user seeds and derivation, then final user Map/Alias overrides. Component tokens override their component defaults. A local explicit algorithm replaces an inherited mode; a local mode replaces an inherited algorithm.

`ConfigProvider` inherits raw parent configuration by default; `inherit: false` resets it. Standalone `ThemeProvider` retains its existing reset-by-default behavior; use `inherit: true` to merge the parent. Parallel/nested providers and their portals and contextual App Message/Notification APIs retain their scopes.

### Resources and preview

See [Styles](/guide/styles) for automatic, manual subpath and aggregate imports. Optional `@apollo-design/theme/presets/default.css`, `/mono.css` and `/material3.css` are generated through the same public derivation API. Load only the preset you use, then set `data-apollo-preset="mono"` and `data-apollo-theme="light|dark|system"`. Direct CSS variable overrides do not recalculate derived palettes; use a provider for seed derivation.

The Docs Header offers independent style and appearance controls on desktop and narrow screens. Preferences persist across navigation and refresh. A pre-paint script sets the public selectors before styles load; SSR keeps deterministic markup and live context starts after hydration. The site's `--site-*` aliases read the public tokens rather than duplicating palettes.

Inline demos inherit the selection while intentional local overrides remain active. Standalone URLs carry initial `preset`, `theme` and `lang`. Frames are created once with current preferences; subsequent same-origin messages verify source and frameId and update context without navigation, preserving input, selection and open state. Docs explicitly loads three optional preset stylesheets for switching; a single-preset application does not need all three.
