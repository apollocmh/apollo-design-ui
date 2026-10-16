---
title:
  zh-CN: 快速开始
  en-US: Getting Started
order: 1
---

## zh-CN

Apollo Design 是以 **Ant Design 6.6.4 为兼容规格**、用 Vue 3 + TypeScript 原生实现的组件库。行为、DOM 结构与视觉对齐 antd，但**不依赖 React**。

### 环境要求

- Vue **3.5+**（Composition API）
- TypeScript 5.x（推荐）
- 现代浏览器（ES2022）

### 安装

> ⚠️ **发布状态**：`@apollo-design/ui` 尚未发布到 npm。当前阶段请从仓库源码使用：

```bash
git clone https://github.com/apollocmh/apollo-design-ui.git
cd apollo-design-ui
pnpm install
pnpm build   # 构建全部包（theme 的 tokens.css 与 ui 的组件样式是真源）
```

构建完成后，在同一个 pnpm workspace 里以 `workspace:*` 引入，或用文件依赖指向构建产物：

```json
{
  "dependencies": {
    "@apollo-design/ui": "workspace:*",
    "@apollo-design/theme": "workspace:*"
  }
}
```

### 引入

```ts
import { createApp } from 'vue';
import App from './App.vue';

// ① 设计令牌（零运行时 CSS 变量，必须最先引入）
import '@apollo-design/theme/tokens.css';
// ② 全量组件样式
import '@apollo-design/ui/style.css';

createApp(App).mount('#app');
```

```vue
<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
</script>

<template>
  <Space>
    <Button type="primary">主按钮</Button>
    <Button>默认按钮</Button>
  </Space>
</template>
```

### 下一步

- [样式引入](/guide/styles) —— tokens.css 与组件样式的关系
- [按需使用](/guide/tree-shaking) —— ESM tree-shaking
- [主题](/guide/theming) —— 亮暗切换与 token 定制
- [国际化](/guide/i18n) —— LocaleProvider 与内置语言包

## en-US

Apollo Design is a Vue 3 + TypeScript component library that treats **Ant Design 6.6.4 as its compatibility specification**. Behavior, DOM structure and visuals align with antd — with **zero React runtime**.

### Requirements

- Vue **3.5+** (Composition API)
- TypeScript 5.x (recommended)
- Modern browsers (ES2022)

### Install

> ⚠️ **Publishing status**: `@apollo-design/ui` is **not published to npm yet**. Use it from the repository source:

```bash
git clone https://github.com/apollocmh/apollo-design-ui.git
cd apollo-design-ui
pnpm install
pnpm build
```

Then depend on it inside the same pnpm workspace via `workspace:*`, or via a file dependency to the built output.

### Usage

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

```vue
<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
</script>

<template>
  <Space>
    <Button type="primary">Primary</Button>
    <Button>Default</Button>
  </Space>
</template>
```
