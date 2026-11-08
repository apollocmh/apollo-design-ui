# @apollo-design/ui-resolver

Apollo Design 的 Vue 模板自动引入工具，配合 `unplugin-vue-components` 将组件名解析为公开 JavaScript 子路径，并按需引入结构 CSS。

## 安装

```bash
npm install @apollo-design/ui @apollo-design/theme vue
npm install -D @apollo-design/ui-resolver unplugin-vue-components
```

当前 peer 要求为 UI `>=0.1.8 <0.2.0`、`unplugin-vue-components ^32.1.0`，Node.js `>=22.12.0`。建议 Apollo 包使用同一发布版本。

## Vite 配置

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ApolloResolver } from '@apollo-design/ui-resolver';

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [ApolloResolver()], dts: 'src/components.d.ts' }),
  ],
});
```

Vite 项目需要已安装 `vite` 和 `@vitejs/plugin-vue`。将生成的 `components.d.ts` 纳入 TypeScript 项目，并在应用入口加载主题变量：

```ts
import '@apollo-design/theme/tokens.css';
```

```vue
<template>
  <AButton type="primary">保存</AButton>
  <AInputSearch placeholder="搜索" />
</template>
```

## 选项与样式

`ApolloResolver({ importStyle?: boolean })` 返回组件解析器。`importStyle` 默认开启，读取 UI 的 `style-manifest.json`，按顺序引入 `base.css`、共享结构资源和组件 `structure.css`。

已经手动加载 `@apollo-design/ui/style.css` 或组件 `style.css` 的项目使用 `ApolloResolver({ importStyle: false })`，由应用统一管理 CSS。主题预设始终由应用选择；解析器不注册组件、不载入主题运行时，也不以全库 CSS 作为缺省兜底。

组件名支持插件归一化后的 PascalCase 与 kebab-case。复合组件使用明确名称，如 `AInputSearch`、`AFormItem`、`ASpaceCompact`、`ALayoutSider`、`ATableSummaryRow`；Typography 支持 `AText` / `ATypographyText` 等别名。未知名称交给其他解析器或本地组件处理。

## 维护

名称表与样式映射以 UI 的公开导出和结构清单为准。AutoComplete、TimePicker 等组件有共享样式来源，不能仅靠名称转 kebab-case 推导路径。

仓库消费者验证使用已构建产物：

```bash
node packages/ui-resolver/tests/consumer.mjs
node packages/ui-resolver/tests/consumer.mjs --themes
```

第一条验证 Vite、SSR、生成声明和浏览器行为；第二条增加预设/自定义主题矩阵。它们构建消费者应用，不重建组件发布产物。

[源码](https://github.com/apollocmh/apollo-design-ui/tree/master/packages/ui-resolver) · [样式指南](https://apollocmh.github.io/apollo-design-ui/guide/styles) · [主题指南](https://apollocmh.github.io/apollo-design-ui/guide/theming)
