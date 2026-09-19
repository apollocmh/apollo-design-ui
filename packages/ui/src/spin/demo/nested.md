---
order: 3
title:
  zh-CN: 嵌套模式
  en-US: Nested
---

**有 children 就进入嵌套模式**（`isNested = hasChildren || fullscreen`）：

- 根元素不再带 `-section`，改由内层 `-section` 承担指示器与文案（绝对居中浮在内容之上）；
- children 被包进 `-container`，转起来时它变半透明且不可交互（`pointer-events: none`）；
- 已废弃的 `wrapperClassName` 会落在根元素上（替代 `-section` 的位置）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Spin } from '@apollo-design/ui';

const loading = ref(false);
</script>

<template>
  <Spin :spinning="loading">
    <div>Alert message title</div>
  </Spin>
  <p>
    加载状态：<input v-model="loading" type="checkbox" />
  </p>
</template>
```
