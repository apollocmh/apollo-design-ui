---
order: 5
title:
  zh-CN: 样式自定义
  en-US: Customize Style
---

`style` 直接落在根元素上，且会**覆盖** `styles.root`（与 antd 的合并顺序一致）。

⚠️ 注意 `borderWidth: 2` 这类**数值**：Vue 运行时的 `setStyle` 不像 React 的
`dangerousStyleValue` 那样补单位，裸数字会被静默丢弃。请写 `'2px'` 或 `2` 之外的单位串。
（组件内部的 `orientationMargin` 已按这条规则处理，见 `README.md` §6。）

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

  <div :style="{ display: 'flex', flexDirection: 'column', height: '50px', boxShadow: '0 0 1px red' }">
    <Divider :style="{ background: 'rgba(0,255,0,0.05)' }" title-placement="start">Text</Divider>
  </div>
</template>
```
