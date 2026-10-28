---
order: 14
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

Space / Compact / Addon 当前没有组件 Token。使用已有 Alias Token 在 ConfigProvider 中局部调整预设 gap 与 Addon 颜色；不虚构 theme.components.Space 字段。

Space, Compact and Addon have no component tokens. Existing Alias tokens in ConfigProvider control local preset gaps and Addon paint.

```vue
<script setup lang="ts">
import { Button, ConfigProvider, Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
</script>
<template>
  <ConfigProvider :theme="{ token: { paddingXS: 12, colorText: '#224466', colorBgContainer: '#ffffff', colorBgContainerDisabled: '#e8f0f8' } }">
    <Space orientation="vertical"><Space><Button>Alias gap</Button><Button>Current theme</Button></Space><SpaceCompact><SpaceAddon>Scoped addon</SpaceAddon><Button type="primary">Button</Button></SpaceCompact></Space>
  </ConfigProvider>
</template>
```
