<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
// ⚠️ antd 用 ConfigProvider 的 theme.components.Message 覆盖组件 token；本仓的
//    组件级 token 覆盖尚未落地（D25/D83 同判）⇒ 以**默认主题**渲染两个面板，
//    差异只在 ConfigProvider 那一层（已登记）。
import { message } from '@apollo-design/ui';

const InternalPanel = message._InternalPanelDoNotUseOrYouWillBeFired;
</script>

<template>
  <div>
    <component :is="InternalPanel" content="Hello World!" type="error" />
    <component :is="InternalPanel" content="Hello World!" type="error" />
  </div>
</template>
