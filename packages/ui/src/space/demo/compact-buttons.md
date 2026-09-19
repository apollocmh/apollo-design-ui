---
order: 7
title:
  zh-CN: 紧凑按钮组
  en-US: Compact Buttons
---

Button 组件紧凑排列的示例。

紧凑排列的核心是**边框合并**：中间项的 `border-inline-start-width` / `border-inline-end-width`
归零，并把 `border-radius` 收成 0 —— 这些都作用在**子组件自己**的前缀上，
由 `useCompactItemContext` 给出的首/末项标志决定。

```vue
<script setup lang="ts">
import { SpaceCompact } from '@apollo-design/ui';
import { BTN_DEFAULT, BTN_PRIMARY } from './_standin';
</script>

<template>
  <div>
    <SpaceCompact block>
      <button type="button" :style="BTN_DEFAULT">Like</button>
      <button type="button" :style="BTN_DEFAULT">Comment</button>
      <button type="button" :style="BTN_DEFAULT">Star</button>
      <button type="button" :style="BTN_DEFAULT">Heart</button>
      <button type="button" :style="BTN_DEFAULT">Share</button>
      <button type="button" :style="BTN_DEFAULT">Download</button>
      <button type="button" :style="BTN_DEFAULT">More</button>
    </SpaceCompact>
    <br />
    <SpaceCompact block>
      <button type="button" :style="BTN_PRIMARY">Button 1</button>
      <button type="button" :style="BTN_PRIMARY">Button 2</button>
      <button type="button" :style="BTN_PRIMARY">Button 3</button>
      <button type="button" :style="BTN_PRIMARY">Button 4</button>
      <button type="button" :style="BTN_PRIMARY" disabled>Download</button>
      <button type="button" :style="BTN_PRIMARY">Download</button>
    </SpaceCompact>
    <br />
    <SpaceCompact block>
      <button type="button" :style="BTN_DEFAULT">Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Button 3</button>
      <button type="button" :style="BTN_DEFAULT" disabled>Download</button>
      <button type="button" :style="BTN_DEFAULT">Download</button>
      <button type="button" :style="BTN_PRIMARY">Button 4</button>
      <button type="button" :style="BTN_PRIMARY">More</button>
    </SpaceCompact>
  </div>
</template>
```
