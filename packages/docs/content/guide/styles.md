---
title:
  zh-CN: 样式引入
  en-US: Styles
order: 2
---

## zh-CN

Apollo Design 使用静态 CSS 与 CSS 变量。JS 导入不会自动安装样式；构建期 resolver、手工子路径和全量导入使用同一主题 API，主题选择与组件按需引入互不依赖。

| 资源 | 职责 |
| --- | --- |
| `@apollo-design/theme/presets/mono.css`（或 default/material3） | 可选的独立公共变量表，包含该风格的 light/dark/system 作用域；由公开派生 API 生成 |
| `@apollo-design/ui/base.css` | 不选择主题的共享基础结构规则 |
| `@apollo-design/ui/<component>/structure.css` | 单一组件结构规则；依赖资源按公开 style-manifest 顺序加载 |
| `@apollo-design/ui/<component>/style.css` | 保留的自包含组件样式，包含内部实现依赖；不要与同组 structure.css 重复引入 |
| `@apollo-design/ui/style.css` | 保留的全量组件样式 |
| `@apollo-design/theme/tokens.css` | 保留的默认亮/暗/紧凑变量表；选择独立预设时不需要同时加载它 |

### 自动按需

以下结构资源与官方 resolver 要求 UI 0.1.8 或更高版本。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ApolloResolver } from '@apollo-design/ui-resolver';

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [ApolloResolver()] })],
});
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { monoPreset } from '@apollo-design/theme/presets/mono';
import '@apollo-design/theme/presets/mono.css';
const theme = { preset: monoPreset, mode: 'system' as const };
</script>

<template>
  <AConfigProvider :theme="theme">
    <AButton type="primary">Mono</AButton>
  </AConfigProvider>
</template>
```

resolver 只从公开子路径导入组件 JS 与结构 CSS，不选择主题，也不引入全量 CSS。它按 `@apollo-design/ui/style-manifest.json` 导入共享基础、依赖与组件结构，重复路径由打包器去重；生成的组件声明需纳入项目 TypeScript 配置。保留已有全量/自包含 CSS 的应用应设 `ApolloResolver({ importStyle: false })`，避免同时引入重叠规则。

### 手工子路径

同一个配置可以手工引入，无需 resolver：

```vue
<script setup lang="ts">
import { ConfigProvider } from '@apollo-design/ui/config-provider';
import { Button } from '@apollo-design/ui/button';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import '@apollo-design/theme/presets/mono.css';
import '@apollo-design/ui/base.css';
import '@apollo-design/ui/button/structure.css';
const theme = { preset: monoPreset, mode: 'system' as const };
</script>

<template>
  <ConfigProvider :theme="theme"><Button type="primary">Mono</Button></ConfigProvider>
</template>
```

Button 的最小结构依赖如上；复杂组件按公开 style-manifest 的完整 styles 列表加载，或使用原有 `ui/<component>/style.css` 自包含入口。用户插槽中的自选组件仍需自己的 CSS。AutoComplete 使用 Select 结构；TimePicker/TimeRangePicker 使用 DatePicker；Layout.Sider 具有独立的 layout-sider 样式入口。ConfigProvider 本身不需要组件样式。

### 全量引入

```vue
<script setup lang="ts">
import { ConfigProvider, Button } from '@apollo-design/ui';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import '@apollo-design/ui/style.css';
import '@apollo-design/theme/presets/mono.css';
const theme = { preset: monoPreset, mode: 'system' as const };
</script>

<template>
  <ConfigProvider :theme="theme"><Button type="primary">Mono</Button></ConfigProvider>
</template>
```

结构入口的推荐顺序是公共变量 → 基础/组件结构 → 用户覆盖；旧聚合或自包含样式先加载，独立预设放在其后，避免旧默认规则覆盖选择。不要在已加载整套 CSS 后再补同组结构资源。应用只需加载自己使用的一个预设；文档站为了切换预览，显式加载全部三份，不作为普通应用的隐式兜底。

### 作用域与动态配置

静态主题通过 `data-apollo-preset="default|mono|material3"` 与 `data-apollo-theme="light|dark|system"` 选择，system 在 CSS 中响应系统明暗。Provider 使用同一预设对象与 `mode` 派生当前作用域，用户全局 Token、组件 Token 与嵌套覆盖见[主题](/guide/theming)。运行时更新 CSS 变量不重挂组件，也不意味着懒加载组件。

```html
<html data-apollo-preset="mono" data-apollo-theme="system">
```

保留默认主题的旧用法仍可使用 `theme/tokens.css` → `ui/style.css`；compact/dark-compact 是该旧资源的密度作用域，不是新的风格预设。发布的组件 CSS 使用 `apollo` 前缀，自定义前缀需匹配的静态样式。站点的 `--site-*` 只引用公共主题 Token，没有独立配色表。

### 默认链接样式

共享基础层为原生链接提供当前主题的颜色、装饰与可见键盘焦点；这些默认值不依赖是否使用 Select。可以用原生 `style` 或自己的 CSS 覆盖。

### 原生表单控件

共享样式保留原生控件的浏览器前景、背景和禁用颜色。Apollo 组件使用各自的主题色；自行给原生控件设置颜色时，请同时配置背景。例如 `style="color: inherit; background: transparent"` 可让原生按钮使用父级颜色，避免暗色作用域中的浅色文字落在浏览器浅色背景上。

## en-US

JavaScript, static component CSS and theme selection are independent. All three import strategies use the same public `ThemeConfig` and independent preset imports; resolver registration is not needed to choose or customize a theme.

The structural resources and official resolver below require UI 0.1.8 or newer.

- **Automatic:** configure `Components({ resolvers: [ApolloResolver()] })` from `unplugin-vue-components/vite` and `@apollo-design/ui-resolver`. In App.vue import `monoPreset` from `@apollo-design/theme/presets/mono` and its optional `mono.css`, then use `<AConfigProvider :theme="{ preset: monoPreset, mode: 'system' }"><AButton>Mono</AButton></AConfigProvider>`. The resolver imports public component JavaScript and the ordered structural CSS resources in `ui/style-manifest.json`; it never imports a preset or aggregate CSS. Include generated component declarations in TypeScript.
- **Manual subpaths:** import `ConfigProvider` from `@apollo-design/ui/config-provider` and `Button` from `@apollo-design/ui/button`, plus the same preset, `ui/base.css` and `ui/button/structure.css`. Complex components need their complete public manifest styles list, or their existing self-contained `ui/<component>/style.css` entry. Slot-provided components need their own styles.
- **Aggregate:** import `{ ConfigProvider, Button }` from `@apollo-design/ui`, then `ui/style.css` and the chosen preset stylesheet. The theme object and template are identical to the manual example.

For neutral structural entries, load public variables, base/component structure, then user overrides. Load legacy aggregate/self-contained styles before an optional preset so their default rules cannot replace the selection. Do not combine overlapping legacy and structural entries. Existing aggregate-style applications can set `ApolloResolver({ importStyle: false })` while retaining JavaScript resolution.

Each optional `theme/presets/default.css`, `/mono.css` or `/material3.css` contains only that preset's public derived variables for light/dark/system. Set `data-apollo-preset` and `data-apollo-theme` on the desired static scope. A single-preset application loads only that preset; Docs deliberately loads all three for its Header preview. The legacy `theme/tokens.css` still supplies default light/dark/compact scopes and is unnecessary alongside a chosen independent preset.

AutoComplete uses Select structure, TimePicker/TimeRangePicker use DatePicker, and Layout.Sider has a separate layout-sider entry. ConfigProvider needs no stylesheet of its own. Published CSS uses the default `apollo` prefix; custom prefixes require matching styles. See [Theming](/guide/theming) for user overrides, nesting and system/SSR behavior.

### Default link styles

The shared base applies themed link colors, decoration and a visible keyboard focus indicator, independently of Select. Native inline styles or application CSS can override these defaults.

### Native form controls

Shared styles preserve the browser's foreground, background and disabled colors for native controls. Apollo components declare their own theme colors. When styling a native control, set its foreground and background together. For example, `style="color: inherit; background: transparent"` lets a native button follow its parent without placing light text on the browser's light background in a dark scope.
