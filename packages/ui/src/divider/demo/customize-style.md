---
order: 5
title:
  zh-CN: 样式自定义
  en-US: Customize Style
---

根 `class` / `style` 使用 Vue 原生 attrs；字符串、对象或数组 style 按 Vue 规则合并，优先于 Provider 与 `styles.root`。CSS 长度写完整单位，例如 borderWidth: '2px'。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  <Divider :style="{ borderWidth: '2px', borderColor: '#7cb305' }" />
  <Divider :style="{ borderColor: '#7cb305' }" dashed />
  <Divider :style="{ borderColor: '#7cb305' }" dashed>Text</Divider>
  <Divider vertical :style="{ height: '60px', borderColor: '#7cb305' }" />
  <Divider vertical :style="{ height: '60px', borderColor: '#7cb305' }" dashed />

  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '50px',
      boxShadow: '0 0 1px red',
    }"
  >
    <Divider :style="{ background: 'rgba(0,255,0,0.05)' }" title-placement="start">Text</Divider>
  </div>
</template>
```
