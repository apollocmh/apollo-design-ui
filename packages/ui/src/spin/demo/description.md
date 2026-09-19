---
order: 2
title:
  zh-CN: 加载文案
  en-US: Description
---

`description` 是加载文案。**只在有 children（嵌套模式）或 `fullscreen` 之外也渲染** ——
它跟着指示器一起出现，因此受 `spinning` 控制。

⚠️ `tip` 是 `description` 的旧名，已废弃（会输出开发期告警）。两者同时传时以
`description` 为准（`description ?? tip`）。

```vue
<script setup lang="ts">
import { Spin } from '@apollo-design/ui';

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
const contentStyle = { padding: '50px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' };
</script>

<template>
  <div :style="rowStyle">
    <Spin description="Loading" size="small">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading" size="large">
      <div :style="contentStyle" />
    </Spin>
  </div>
</template>
```
