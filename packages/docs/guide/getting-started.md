# 快速开始

## 安装

```bash
# pnpm
pnpm add @apollo-design/ui @apollo-design/theme
```

## 引入样式

样式是**静态 CSS + CSS 变量**（无 CSS-in-JS 运行时），两份全局样式一次性引入：

```ts
// main.ts
import '@apollo-design/theme/tokens.css'; // 设计令牌（:root 上的 --apollo-* 变量）
import '@apollo-design/ui/style.css';     // 全量组件样式
```

按需引入样式时，每个组件也有独立的深入口：

```ts
import '@apollo-design/ui/button/style.css';
```

## 使用组件

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary">主要按钮</Button>
</template>
```

## 类名前缀

默认前缀为 `apollo`（如 `apollo-btn`）。可通过 `ConfigProvider` 的 `prefixCls` 全局调整。

## 本地开发文档站

```bash
pnpm docs:dev   # 本地实时预览（组件 demo 实时渲染）
pnpm build:docs # 产出 dist/（GitHub Pages 部署产物）
```

组件文档与 demo 的唯一真源在 `packages/ui/src/<组件>/`，文档站的组件页由
`packages/docs/scripts/gen-component-pages.mjs` 在每次 dev/build 前自动生成。
