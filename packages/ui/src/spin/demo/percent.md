---
order: 6
title:
  zh-CN: 进度
  en-US: Progress
---

`percent` 传数字时渲染一条定长进度环；传 `'auto'` 时组件自己按 **200ms 一档渐近推进**
（越接近 100% 步进越小，永远到不了 100%），用于「不知道还要多久」的场景。

⚠️ 两条容易踩的语义：

- `percent` 只在 `spinning` 为真时渲染；进度环会被 `<svg role="progressbar">` 包住，
  并且**首帧不渲染**（与 React 的 `useLayoutEffect` 对齐），`percent === 0` 时始终不渲染；
- 超出 `[0, 100]` 的值会被 `Math.max(Math.min(percent, 100), 0)` 夹住后再写进
  `aria-valuenow`，而**几何**上用的是夹之前的值（上游行为，逐字保留）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Spin } from '@apollo-design/ui';

const auto = ref(false);
const percent = ref(-50);
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center', gap: '16px' }">
    <label>
      <input v-model="auto" type="checkbox" />
      Auto
    </label>
    <Spin :percent="auto ? 'auto' : percent" size="small" />
    <Spin :percent="auto ? 'auto' : percent" />
    <Spin :percent="auto ? 'auto' : percent" size="large" />
  </div>
</template>
```
