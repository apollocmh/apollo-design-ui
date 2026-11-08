# @apollo-design/ui

Apollo Design 的 Vue 3 UI 组件库，提供表单、数据展示、导航、反馈与布局组件。组件使用 Vue 响应性、插槽和事件，提供 TypeScript 声明；样式以静态 CSS 和 CSS 变量交付。

[组件文档](https://apollocmh.github.io/apollo-design-ui/components/button) · [主题预览](https://apollocmh.github.io/apollo-design-ui/guide/themes) · [源码](https://github.com/apollocmh/apollo-design-ui)

## 安装

```bash
npm install @apollo-design/ui @apollo-design/theme vue
```

Vue 的 peer 版本要求为 `^3.5.42`。建议所有直接安装的 `@apollo-design/*` 包使用同一版本；基础依赖由包管理器自动安装。

## 快速开始

在应用入口引入默认主题变量与组件样式：

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Input, Space } from '@apollo-design/ui';

const name = ref('');
const submitted = ref('');
</script>

<template>
  <Space direction="vertical">
    <Input v-model:value="name" placeholder="你的名字" />
    <Button type="primary" @click="submitted = name">保存</Button>
    <span v-if="submitted">已保存：{{ submitted }}</span>
  </Space>
</template>
```

## 主题与语言

`ConfigProvider` 提供主题、语言、尺寸、方向和组件默认配置。Default、Mono、Material 三套预设均支持亮色、暗色与跟随系统；局部 Provider 可以覆盖父级配置。

```vue
<script setup lang="ts">
import { Button, ConfigProvider } from '@apollo-design/ui';
import { zh_CN } from '@apollo-design/locale';
import { material3Preset } from '@apollo-design/theme/presets/material3';
</script>

<template>
  <ConfigProvider :locale="zh_CN" :theme="{ preset: material3Preset, mode: 'system' }">
    <Button type="primary">开始使用</Button>
  </ConfigProvider>
</template>
```

直接使用语言包时安装 `@apollo-design/locale`。主题接入及首屏样式配置见[主题指南](https://apollocmh.github.io/apollo-design-ui/guide/theming)。

## 按需使用

组件支持公开子路径，例如 `import { Button } from '@apollo-design/ui/button'`。手动按需引入时加载对应的 `@apollo-design/ui/button/style.css` 和主题变量。

模板自动引入使用 [`@apollo-design/ui-resolver`](https://www.npmjs.com/package/@apollo-design/ui-resolver)。它按组件加载结构 CSS；已经加载汇总样式的项目应设置 `importStyle: false`，避免重复 CSS。

## 使用边界

- 浏览器交互在客户端挂载后建立。SSR 应使用各组件的服务端契约，弹层容器在客户端可用后打开。
- 插槽、`v-model` 与事件以各组件文档为准，不承诺其他组件库的直接替换兼容。
- 需要应用上下文的反馈服务，使用 `App` 或对应的上下文 API；全局静态调用不自动携带任意组件树的配置。
- 发布运行图不依赖 React、React DOM 或 CSS-in-JS 运行时。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
