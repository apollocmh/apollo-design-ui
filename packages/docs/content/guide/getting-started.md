---
title:
  zh-CN: 快速开始
  en-US: Getting Started
order: 1
---

## zh-CN

Apollo Design 是独立发展的 **Vue 3 + TypeScript 原生组件库**，以公开 API、真实使用场景和一致的设计语言演进，提供静态 CSS 与 CSS 变量主题方案。

### 环境要求

- Vue **3.5+**（Composition API）
- TypeScript 5.x（推荐）
- 现代浏览器（ES2022）

### 安装

```bash
npm install @apollo-design/ui @apollo-design/theme vue
```

图标按需安装 `@apollo-design/icons`。使用 AI 编程助手时，可参考 [AI 接入](/guide/ai) 获取当前版本的 API 与示例。

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
- [国际化](/guide/i18n) —— ConfigProvider 与内置语言包

## en-US

Apollo Design is an **independent Vue 3 + TypeScript component library** with consistent interactions, static CSS and CSS-variable themes. Its public APIs and user scenarios define the component contracts.

### Requirements

- Vue **3.5+** (Composition API)
- TypeScript 5.x (recommended)
- Modern browsers (ES2022)

### Install

```bash
npm install @apollo-design/ui @apollo-design/theme vue
```

Install `@apollo-design/icons` if you need icons. See [AI integration](/guide/ai) for versioned API documentation and examples.

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
