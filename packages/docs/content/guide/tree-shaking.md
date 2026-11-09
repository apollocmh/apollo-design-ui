---
title:
  zh-CN: 按需使用
  en-US: Tree Shaking
order: 3
---

## zh-CN

Apollo Design 支持通过 `@apollo-design/ui-resolver` 自动按需引入，也支持手动导入。组件以 ESM 模块发布，打包器可以对未使用的导出做 tree-shaking；组件样式和主题变量按下面的方式加载。

### 自动按需引入

使用 `@apollo-design/ui-resolver` 配合 `unplugin-vue-components`，可以根据 Vue 模板自动引入组件及其所需的结构样式。

#### 安装

```bash
npm install @apollo-design/ui @apollo-design/theme vue
npm install -D @apollo-design/ui-resolver unplugin-vue-components
```

当前 resolver 支持 UI `>=0.1.8 <0.2.0` 和 `unplugin-vue-components ^32.1.0`，建议 Apollo 包使用相同发布版本。以下配置适用于已安装 `vite` 和 `@vitejs/plugin-vue` 的 Vue 项目。

#### 配置 Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ApolloResolver } from '@apollo-design/ui-resolver';

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ApolloResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
});
```

将生成的 `src/components.d.ts` 纳入应用的 TypeScript 配置，例如已有的 `include: ["src/**/*.ts", "src/**/*.vue"]` 会包含它。

#### 加载主题并使用组件

在应用入口加载默认主题变量：

```ts
// main.ts
import '@apollo-design/theme/tokens.css';
```

模板中使用 `A` 前缀组件，无需在 `<script setup>` 中手动导入：

```vue
<template>
  <ASpace>
    <AButton type="primary">保存</AButton>
    <AInputSearch placeholder="搜索" />
  </ASpace>
</template>
```

复合组件使用明确名称，例如 `AInputSearch`、`AFormItem`、`ASpaceCompact`、`ALayoutSider`。模板也可使用对应的 kebab-case，例如 `<a-button>`。

`ApolloResolver()` 默认按需加载组件及依赖的结构 CSS，重复样式路径由打包器去重；主题变量由应用选择和加载。此方式无需再引入 `@apollo-design/ui/style.css` 或同组组件的 `style.css`。选择 Mono、Material 等独立主题时，参照[样式引入](/guide/styles)与[主题](/guide/theming)配置预设。

如果项目已经全量引入样式，或希望自行管理 CSS，可关闭 resolver 的样式导入：

```ts
ApolloResolver({ importStyle: false })
```

关闭后仍会自动引入组件 JS，但应用需要自行加载所需样式。resolver 面向 Vue 模板；在脚本中调用 `message`、`notification` 等服务，或在 TSX / render 函数中使用组件时，仍需显式导入，并加载相应样式。

### 手动按需引入

手动选择组件及其自包含样式入口：

```ts
import { Button, Space, Table } from '@apollo-design/ui';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/button/style.css';
import '@apollo-design/ui/space/style.css';
import '@apollo-design/ui/table/style.css';
```

也可从公开子路径导入，例如 `import { Button } from '@apollo-design/ui/button'`。打包器会保留所用组件及其实际 JS 依赖；各组件的 `style.css` 包含实现内部所需的样式，插槽中由应用选择的其他组件仍需自己的样式。

### 全量样式

需要统一加载全库样式时，在应用入口引入：

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

这种方式仍可使用 JS 的命名导入与 tree-shaking；如果同时启用 resolver，请设置 `importStyle: false`，避免叠加重复样式。更多结构样式、独立预设和加载顺序见[样式引入](/guide/styles)。

## en-US

Apollo Design supports automatic imports through `@apollo-design/ui-resolver` and explicit imports. Its ESM modules allow bundlers to tree-shake unused exports. Component CSS and theme variables are loaded as described below.

### Automatic imports

Use `@apollo-design/ui-resolver` with `unplugin-vue-components` to import components and their structural CSS from Vue templates.

```bash
npm install @apollo-design/ui @apollo-design/theme vue
npm install -D @apollo-design/ui-resolver unplugin-vue-components
```

The current resolver supports UI `>=0.1.8 <0.2.0` and `unplugin-vue-components ^32.1.0`. Keep Apollo packages on the same release version. Your Vue project must already have `vite` and `@vitejs/plugin-vue` installed.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ApolloResolver } from '@apollo-design/ui-resolver';

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ApolloResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
});
```

Include the generated `src/components.d.ts` in your application's TypeScript project. An existing `include: ["src/**/*.ts", "src/**/*.vue"]` covers it.

Load default theme variables in your application entry:

```ts
// main.ts
import '@apollo-design/theme/tokens.css';
```

Use `A`-prefixed names in templates without manually importing components:

```vue
<template>
  <ASpace>
    <AButton type="primary">Save</AButton>
    <AInputSearch placeholder="Search" />
  </ASpace>
</template>
```

Compound components use explicit names such as `AInputSearch`, `AFormItem`, `ASpaceCompact` and `ALayoutSider`. Their kebab-case equivalents, such as `<a-button>`, also work in templates.

`ApolloResolver()` imports component JavaScript and the required structural CSS by default. Bundlers deduplicate repeated stylesheet paths. Your application chooses and loads the theme variables; do not also load `ui/style.css` or overlapping component `style.css` files. See [Styles](/guide/styles) and [Theming](/guide/theming) for independent presets such as Mono and Material.

If you already load aggregate CSS or want to manage styles yourself, disable automatic style imports:

```ts
ApolloResolver({ importStyle: false })
```

JavaScript resolution remains enabled, while your application takes responsibility for styles. The resolver handles Vue templates. Services such as `message` and `notification`, and components used in TSX or render functions, still require explicit imports and their corresponding styles.

### Manual imports

Choose components and their self-contained stylesheets explicitly:

```ts
import { Button, Space, Table } from '@apollo-design/ui';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/button/style.css';
import '@apollo-design/ui/space/style.css';
import '@apollo-design/ui/table/style.css';
```

Public subpaths also work, for example `import { Button } from '@apollo-design/ui/button'`. Bundlers retain the used components and their actual JavaScript dependencies. Each component's `style.css` includes implementation-owned style dependencies. Components supplied by your application through slots need their own styles.

### Aggregate CSS

Load all component styles in your application entry:

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

Named JavaScript imports remain tree-shakeable. When combining aggregate CSS with the resolver, set `importStyle: false` to avoid overlapping styles. See [Styles](/guide/styles) for structural entries, independent presets and import order.
